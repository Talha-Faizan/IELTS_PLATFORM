import { ProtectedRoute } from "@/components/ProtectedRoute";
import PracticeQuestionList from "@/components/sections/PracticeQuestionList";

export default function ReadingQuestionListPage() {
  return (
    <ProtectedRoute>
      <PracticeQuestionList section="reading" />
    </ProtectedRoute>
  );
}
