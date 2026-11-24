
import { Suspense } from "react";
import TeacherAnswerEditor from "./TeacherAnswerEditor";

async function AnswerPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <TeacherAnswerEditor submissionId={id} />;
}

export default function TeacherAnswerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-slate-500">
            Loading answer editor...
          </p>
        </div>
      }
    >
      <AnswerPageContent params={params} />
    </Suspense>
  );
}
