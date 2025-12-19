import React from 'react';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';

/**
 * ChatIcon component that displays a conversation indicator
 * @param {boolean} hasConversation - Whether a conversation exists (ActionBy is not null)
 * @param {object} style - Additional styles to apply
 */
const ChatIcon = ({ hasConversation = false, style = {} }) => {
  const iconColor = hasConversation ? '#0BAA60' : '#999D9E';
  
  return (
    <QuestionAnswerIcon 
      style={{ 
        width: '18.33px', 
        height: '18.33px', 
        color: iconColor,
        position: 'relative',
        top: '1.83px',
        left: '1.83px',
        opacity: 1,
        ...style
      }} 
    />
  );
};

export default ChatIcon;
