import React, { Suspense, lazy } from 'react';
import ScreenLoader from '../../components/ScreenLoader';

const ChatbotContent = lazy(() => import('../../../admin/components/ChatbotContent'));

export default function ChatbotDashboardScreen() {
  return (
    <Suspense fallback={<ScreenLoader message="Loading Chatbot..." />}>
      <ChatbotContent />
    </Suspense>
  );
}
