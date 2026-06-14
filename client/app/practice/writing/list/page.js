import { ProtectedRoute } from "@/components/ProtectedRoute";
import PracticeQuestionList from "@/components/sections/PracticeQuestionList";

export default function WritingQuestionListPage() {
  return (
    <ProtectedRoute>
      <PracticeQuestionList section="writing" />
    </ProtectedRoute>
  );
}
