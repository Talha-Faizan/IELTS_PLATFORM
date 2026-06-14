import { ProtectedRoute } from "@/components/ProtectedRoute";
import PracticeQuestionList from "@/components/sections/PracticeQuestionList";

export default function ListeningQuestionListPage() {
  return (
    <ProtectedRoute>
      <PracticeQuestionList section="listening" />
    </ProtectedRoute>
  );
}
