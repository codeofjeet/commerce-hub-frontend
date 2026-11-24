
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  role: string;
  board?: string;
  classLevel?: string;
}

interface Subject {
  _id: string;
  name: string;
  slug: string;
  boards: string[];
  courseLevels: string[];
  isActive: boolean;
}

interface Chapter {
  _id: string;
  title: string;
  chapterNumber: number;
  subject: string | { _id: string; name: string; slug: string };
  board: string;
  courseLevel: string;
  isActive: boolean;
}

interface QuestionSuggestion {
  _id: string;
  questionText: string;
  questionType: string;
  difficulty: string;
  marks: number;
}

interface ChatMessage {
  _id?: string;
  role: "student" | "assistant";
  content: string;
  answerSource?: string;
  questionSubmission?: string | null;
  createdAt?: string;
}

interface Conversation {
  conversationId: string;
  title: string;
  customTitle?: string;
  subject: {
    _id: string;
    name: string;
    slug: string;
  };
  lastMessage: {
    role: string;
    content: string;
    answerSource: string;
    createdAt: string;
  } | null;
  totalMessages: number;
  createdAt: string;
  updatedAt: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function StudentChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [suggestedQuestions, setSuggestedQuestions] = useState<
    QuestionSuggestion[]
  >([]);

  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [activeConversation, setActiveConversation] =
    useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");

  // Conversation search and subject filter
  const [searchConversation, setSearchConversation] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [deletingConversation, setDeletingConversation] =
    useState<string | null>(null);

  const [renamingConversation, setRenamingConversation] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const getToken = () => {
    return localStorage.getItem("commerceHubToken");
  };

  // Fetch conversation history
  const fetchHistory = useCallback(async (token: string) => {
    setHistoryLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to load chat history.");
      }

      setConversations(result.data || []);
    } catch (err) {
      console.error("Chat history error:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  
// Fetch active chapters for the selected subject and student's academic details.
useEffect(() => {
  if (!selectedSubject || !student?.classLevel) {
    return;
  }

  const controller = new AbortController();

  const fetchChapters = async () => {
    setChaptersLoading(true);

    try {
      const params = new URLSearchParams({
        subject: selectedSubject,
        courseLevel: student.classLevel!,
      });

      if (student.board) {
        params.set("board", student.board);
      }

      const response = await fetch(
        `${API_URL}/api/chapters?${params.toString()}`,
        { signal: controller.signal },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to load chapters.");
      }

      setChapters(result.data || []);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Chapter loading error:", err);
      setChapters([]);
      setSelectedChapter("");
    } finally {
      if (!controller.signal.aborted) {
        setChaptersLoading(false);
      }
    }
  };

  void fetchChapters();

  return () => controller.abort();
}, [selectedSubject, student?.board, student?.classLevel]);

// Fetch subject-specific suggested questions
useEffect(() => {
  if (!selectedSubject || !student?.board || !student?.classLevel) {
    return;
  }

  const controller = new AbortController();

  const fetchSuggestedQuestions = async () => {
    setSuggestionsLoading(true);

    try {
      const params = new URLSearchParams({
        subject: selectedSubject,
        board: student.board!,
        courseLevel: student.classLevel!,
        limit: "4",
      });

      const response = await fetch(
        `${API_URL}/api/questions?${params.toString()}`,
        {
          signal: controller.signal,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load suggested questions."
        );
      }

      setSuggestedQuestions(result.data || []);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("Suggested questions error:", err);
      setSuggestedQuestions([]);
    } finally {
      if (!controller.signal.aborted) {
        setSuggestionsLoading(false);
      }
    }
  };

  void fetchSuggestedQuestions();

  return () => {
    controller.abort();
  };
}, [selectedSubject, student?.board, student?.classLevel]);

  // Initialize student, subjects and conversation history
  useEffect(() => {
    const initializeChat = async () => {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const [profileResponse, subjectsResponse] = await Promise.all([
          fetch(`${API_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/api/subjects`),
        ]);

        const profileResult = await profileResponse.json();
        const subjectsResult = await subjectsResponse.json();

        if (!profileResponse.ok) {
          localStorage.removeItem("commerceHubToken");
          localStorage.removeItem("commerceHubUser");
          router.replace("/login");
          return;
        }

        const currentStudent: Student = profileResult.user;

        if (currentStudent.role !== "student") {
          router.replace("/login");
          return;
        }

        setStudent(currentStudent);

        if (!subjectsResponse.ok) {
          throw new Error(
            subjectsResult.message || "Unable to load subjects."
          );
        }

        const allSubjects: Subject[] = subjectsResult.data || [];

        const matchingSubjects = allSubjects.filter((subject) => {
          const courseMatches = subject.courseLevels.includes(
            currentStudent.classLevel || ""
          );

          const boardMatches =
            !currentStudent.board ||
            subject.boards.includes(currentStudent.board);

          return subject.isActive && courseMatches && boardMatches;
        });

        setSubjects(matchingSubjects);

        if (matchingSubjects.length > 0) {
          setSelectedSubject(matchingSubjects[0]._id);
        }

        await fetchHistory(token);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to initialize chatbot."
        );
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [router, fetchHistory]);

  // Filter conversations by search text and subject
  const filteredConversations = conversations.filter((conversation) => {
    const searchText = searchConversation.trim().toLowerCase();

    const title = conversation.title?.toLowerCase() || "";
    const subjectName = conversation.subject?.name?.toLowerCase() || "";
    const lastMessage =
      conversation.lastMessage?.content?.toLowerCase() || "";

    const matchesSearch =
      !searchText ||
      title.includes(searchText) ||
      subjectName.includes(searchText) ||
      lastMessage.includes(searchText);

    const matchesSubject =
      filterSubject === "all" ||
      conversation.subject?._id === filterSubject;

    return matchesSearch && matchesSubject;
  });

  // Open an existing conversation
  const openConversation = async (conversationId: string) => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setConversationLoading(true);
    setError("");
    setSuccess("");
    setMobileSidebarOpen(false);

    try {
      const response = await fetch(
        `${API_URL}/api/chat/history/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to open conversation.");
      }

      setActiveConversation(result.data.conversationId);
      setSelectedSubject(result.data.subject._id);
      setSelectedChapter("");
      setMessages(result.data.messages || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open conversation."
      );
    } finally {
      setConversationLoading(false);
    }
  };

  // Start a new conversation
  const startNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    setQuestion("");
    setError("");
    setSuccess("");
    setSelectedChapter("");
    setMobileSidebarOpen(false);
  };

  // Delete conversation
  const handleDeleteConversation = async (
    conversationId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    if (sending || deletingConversation) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation? This action cannot be undone."
    );

    if (!confirmed) return;

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setDeletingConversation(conversationId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/chat/history/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to delete conversation."
        );
      }

      setConversations((previous) =>
        previous.filter(
          (conversation) =>
            conversation.conversationId !== conversationId
        )
      );

      if (activeConversation === conversationId) {
        setActiveConversation(null);
        setMessages([]);
        setQuestion("");
      }

      setSuccess("Conversation deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete conversation."
      );
    } finally {
      setDeletingConversation(null);
    }
  };

  // Rename conversation
  const handleRenameConversation = async (
    conversation: Conversation,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    if (sending || deletingConversation || renamingConversation) return;

    const currentTitle =
      conversation.customTitle || conversation.title || "";

    const enteredTitle = window.prompt(
      "Enter a new conversation title (maximum 100 characters):",
      currentTitle
    );

    if (enteredTitle === null) return;

    const customTitle = enteredTitle.trim();

    if (!customTitle) {
      setError("Conversation title cannot be empty.");
      setSuccess("");
      return;
    }

    if (customTitle.length > 100) {
      setError("Conversation title cannot exceed 100 characters.");
      setSuccess("");
      return;
    }

    if (customTitle === currentTitle) return;

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setRenamingConversation(conversation.conversationId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/chat/history/${conversation.conversationId}/rename`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ customTitle }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to rename conversation.");
      }

      setConversations((previous) =>
        previous.map((item) =>
          item.conversationId === conversation.conversationId
            ? {
                ...item,
                title: result.data?.customTitle || customTitle,
                customTitle: result.data?.customTitle || customTitle,
              }
            : item
        )
      );

      setSuccess("Conversation renamed successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to rename conversation."
      );
    } finally {
      setRenamingConversation(null);
    }
  };

  // Send student question
  const sendMessage = async () => {
    const cleanedQuestion = question.trim();

    if (!cleanedQuestion || sending) return;

    if (!selectedSubject) {
      setError("Please select a subject first.");
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");
    setQuestion("");

    try {
      const response = await fetch(`${API_URL}/api/chat/message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId: selectedSubject,
          ...(selectedChapter ? { chapterId: selectedChapter } : {}),
          questionText: cleanedQuestion,
          ...(activeConversation
            ? { conversationId: activeConversation }
            : {}),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to send question.");
      }

      const conversationId = result.data.conversationId;

      setActiveConversation(conversationId);

      const detailResponse = await fetch(
        `${API_URL}/api/chat/history/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const detailResult = await detailResponse.json();

      if (!detailResponse.ok) {
        throw new Error(
          detailResult.message || "Unable to retrieve chat response."
        );
      }

      setMessages(detailResult.data.messages || []);

      await fetchHistory(token);
    } catch (err) {
      setQuestion(cleanedQuestion);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("commerceHubToken");
    localStorage.removeItem("commerceHubUser");
    router.replace("/login");
  };

  // Format date
  const formatDate = (date?: string) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Automatic scrolling
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, sending, conversationLoading]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading Commerce Hub Chat...</p>
      </main>
    );
  }

  if (error && !student) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
        <div className="rounded-xl bg-white p-8 text-center shadow-md">
          <p className="text-red-600">{error}</p>

          <button
            onClick={() => router.replace("/student/dashboard")}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 md:p-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 md:hidden"
            >
              ☰
            </button>

            <div>
              <h1 className="text-lg font-bold text-slate-800 md:text-xl">
                Commerce Hub Chat
              </h1>

              <p className="text-xs text-slate-500 md:text-sm">
                Your personal commerce learning assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-600 sm:block">
              {student?.name}
            </span>

            <button
              type="button"
              onClick={() => router.push("/student/dashboard")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 md:text-sm"
            >
              Dashboard
            </button>
          </div>
        </header>

        <div className="relative flex min-h-[650px] md:min-h-[750px]">

          {/* Sidebar */}
          <aside
            className={`absolute inset-y-0 left-0 z-20 w-72 border-r border-slate-200 bg-slate-50 p-4 transition-transform md:static md:block ${
              mobileSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }`}
          >
            <button
              type="button"
              onClick={startNewChat}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + New Conversation
            </button>

            {/* Conversation History */}
            <div className="mt-6">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Conversations
              </h2>

              {/* Search Conversations */}
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-400">
                <span className="text-slate-400">🔍</span>

                <input
                  type="text"
                  value={searchConversation}
                  onChange={(e) =>
                    setSearchConversation(e.target.value)
                  }
                  placeholder="Search conversations..."
                  aria-label="Search conversations"
                  className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />

                {searchConversation && (
                  <button
                    type="button"
                    onClick={() => setSearchConversation("")}
                    className="text-slate-400 hover:text-red-500"
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Conversations by Subject */}
              <div className="mb-3">
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  aria-label="Filter conversations by subject"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="all">All Subjects</option>

                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {historyLoading ? (
                <p className="text-sm text-slate-500">
                  Loading history...
                </p>
              ) : conversations.length === 0 ? (
                <p className="rounded-lg bg-white p-3 text-sm text-slate-500">
                  No previous conversations.
                </p>
              ) : filteredConversations.length === 0 ? (
                <p className="rounded-lg bg-white p-3 text-sm text-slate-500">
                  No conversations found. Try another search or subject.
                </p>
              ) : (
                <div className="max-h-[470px] space-y-2 overflow-y-auto">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.conversationId}
                      className={`flex items-start gap-1 rounded-xl border p-2 transition ${
                        activeConversation === conversation.conversationId
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-200"
                      }`}
                    >
                      {/* Open Conversation */}
                      <button
                        type="button"
                        onClick={() =>
                          openConversation(conversation.conversationId)
                        }
                        disabled={
                          deletingConversation === conversation.conversationId
                        }
                        className="min-w-0 flex-1 p-1 text-left"
                      >
                        <p
                          className="truncate text-sm font-semibold text-slate-800"
                          title={
                            conversation.title ||
                            conversation.subject?.name ||
                            "Conversation"
                          }
                        >
                          {conversation.title ||
                            conversation.subject?.name ||
                            "Conversation"}
                        </p>

                        {/* Subject Name */}
                        <p className="mt-1 text-[11px] font-medium text-blue-600">
                          {conversation.subject?.name}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {conversation.lastMessage?.content ||
                            "New conversation"}
                        </p>

                        <p className="mt-2 text-[11px] text-slate-400">
                          {formatDate(conversation.updatedAt)}
                        </p>
                      </button>

                      {/* Rename Conversation */}
                      <button
                        type="button"
                        title="Rename conversation"
                        aria-label="Rename conversation"
                        disabled={
                          renamingConversation !== null ||
                          deletingConversation === conversation.conversationId
                        }
                        onClick={(event) =>
                          void handleRenameConversation(conversation, event)
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                      >
                        {renamingConversation === conversation.conversationId
                          ? "..."
                          : "✎"}
                      </button>

                      {/* Delete Conversation */}
                      <button
                        type="button"
                        title="Delete conversation"
                        aria-label="Delete conversation"
                        disabled={
                          deletingConversation === conversation.conversationId
                        }
                        onClick={(event) =>
                          handleDeleteConversation(
                            conversation.conversationId,
                            event
                          )
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingConversation === conversation.conversationId
                          ? "..."
                          : "🗑"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-8 w-full rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </aside>

          {/* Chat Area */}
          <section className="flex min-w-0 flex-1 flex-col bg-white">

            {/* Subject Selection */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Selected Subject
                </p>

                <select
                  value={selectedSubject}
                  onChange={(e) => {
  setSelectedSubject(e.target.value);
  setChapters([]);
  setSelectedChapter("");

  setSuggestedQuestions([]);
  setActiveConversation(null);
  setMessages([]);
  setQuestion("");
  setError("");
  setSuccess("");
}}
                  disabled={sending || conversationLoading}
                  className="mt-1 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="">Select Subject</option>

                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Select Chapter
                </p>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  disabled={
                    !selectedSubject || chaptersLoading || sending || conversationLoading
                  }
                  className="mt-1 max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">All Chapters</option>
                  {chapters.map((chapter) => (
                    <option key={chapter._id} value={chapter._id}>
                      Chapter {chapter.chapterNumber}: {chapter.title}
                    </option>
                  ))}
                </select>
                {chaptersLoading && (
                  <p className="mt-1 text-xs text-slate-400">Loading chapters...</p>
                )}
                {!chaptersLoading && selectedSubject && chapters.length === 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    No active chapters available. Searching all chapters.
                  </p>
                )}
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                ● Database Chat
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50 p-4 md:p-6">

              {/* New Conversation Welcome Screen */}
              {!activeConversation && messages.length === 0 && (
                <div className="flex min-h-[390px] flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl">
                    💬
                  </div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Hello, {student?.name?.split(" ")[0]}!
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Ask your commerce questions and get answers from
                    our verified question bank. Unanswered questions
                    can be submitted to your teacher.
                  </p>

                  {/* Subject-Specific Suggested Questions */}
                  <div className="mt-6 w-full max-w-lg">
                    <h3 className="mb-3 text-left text-sm font-semibold text-slate-700">
                      Suggested Questions
                    </h3>

                    {suggestionsLoading ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                        <p className="text-sm text-slate-500">
                          Loading suggested questions...
                        </p>
                      </div>
                    ) : suggestedQuestions.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {suggestedQuestions.map((item) => (
                          <button
                            type="button"
                            key={item._id}
                            onClick={() => {
                              setQuestion(item.questionText);
                              setError("");
                              setSuccess("");
                            }}
                            className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm text-slate-600 transition hover:border-blue-400 hover:bg-blue-50"
                          >
                            <span className="block leading-6">
                              {item.questionText}
                            </span>

                            <span className="mt-2 block text-xs font-semibold text-blue-600">
                              Ask this question →
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm text-slate-500">
                          No suggested questions are available for this
                          subject yet. You can type your own question below.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {conversationLoading && (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading conversation...
                </p>
              )}

              {!conversationLoading &&
                messages.map((message, index) => (
                  <div
                    key={message._id || index}
                    className={`flex ${
                      message.role === "student"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm md:max-w-[75%] ${
                        message.role === "student"
                          ? "rounded-br-sm bg-blue-600 text-white"
                          : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {message.content}
                      </p>

                      {message.role === "assistant" && (
                        <div className="mt-3 border-t border-slate-100 pt-2">
                          {message.answerSource === "verified_database" ? (
                            <span className="text-xs font-semibold text-green-700">
                              ✓ Verified Database Answer
                            </span>
                          ) : message.answerSource === "ai_generated" ? (
                            <span className="text-xs font-semibold text-blue-600">
                              ✨ AI Generated Answer
                            </span>
                          ) : message.answerSource === "no_answer" ? (
                            <span className="text-xs font-semibold text-orange-600">
                              ⏳ Submitted for Teacher Review
                            </span>
                          ) : null}
                        </div>
                      )}

                      {message.createdAt && (
                        <p
                          className={`mt-2 text-[10px] ${
                            message.role === "student"
                              ? "text-blue-100"
                              : "text-slate-400"
                          }`}
                        >
                          {formatDate(message.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

              {/* Typing Animation */}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                    </div>

                    <span className="text-sm text-slate-500">
                      Searching question bank...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error and Success Messages */}
            {(error || success) && (
              <div
                className={`px-4 py-2 text-sm ${
                  error
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {error || success}
              </div>
            )}

            {/* Message Input */}
            <div className="border-t border-slate-200 bg-white p-4 md:p-5">
              <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-slate-50 p-2 focus-within:border-blue-400">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask your commerce question..."
                  rows={2}
                  maxLength={2000}
                  disabled={sending || !selectedSubject}
                  className="max-h-32 min-h-12 flex-1 resize-y bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={
                    sending ||
                    !question.trim() ||
                    !selectedSubject
                  }
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send ↑"}
                </button>
              </div>

              <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-slate-400">
                <span>
                  Press Enter to send · Shift + Enter for a new line
                </span>

                <span>{question.length}/2000</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
