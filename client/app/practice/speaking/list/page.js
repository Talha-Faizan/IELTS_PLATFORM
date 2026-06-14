import { ProtectedRoute } from "@/components/ProtectedRoute";
import PracticeQuestionList from "@/components/sections/PracticeQuestionList";

export default function SpeakingQuestionListPage() {
  return (
    <ProtectedRoute>
      <PracticeQuestionList section="speaking" />
    </ProtectedRoute>
  );
}
