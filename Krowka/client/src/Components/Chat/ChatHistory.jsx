import React from 'react';

import { Text, Box, Container, useColorModeValue, Image, Link, VStack } from '@chakra-ui/react';
import './Chat.css';

// Renders message bubbles for the current conversation
const ChatHistory = ({ currentUser, chats = [] }) => {
  const incomingBg = useColorModeValue('gray.200', 'whiteAlpha.200');
  const outgoingBg = useColorModeValue('brand.500', 'brand.400');
  const incomingColor = useColorModeValue('gray.900', 'gray.100');
  const outgoingColor = 'white';

  const isImageUrl = (u) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(u);
  const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/\S+|\/uploads\/\S+)/g;
    return (text || '').match(urlRegex) || [];
  };

  const renderContent = (msg) => {
    // Split into lines to allow URL on first line and text below
    const lines = (msg || '').split('\n');
    const nodes = [];
    lines.forEach((line, idx) => {
      const urls = extractUrls(line);
      if (urls.length > 0) {
        urls.forEach((u, i) => {
          if (isImageUrl(u)) {
            nodes.push(<Image key={`img-${idx}-${i}`} src={u} alt="attachment" maxW="xs" borderRadius="md" mb={1} />);
          } else {
            nodes.push(<Link key={`lnk-${idx}-${i}`} href={u} color="teal.300" isExternal>{u}</Link>);
          }
        });
      } else if (line.trim() !== '') {
        nodes.push(<Text key={`txt-${idx}`} whiteSpace="pre-wrap">{line}</Text>);
      }
    });
    if (nodes.length === 0) {
      return <Text whiteSpace="pre-wrap">{msg}</Text>;
    }
    return <VStack align="start" spacing={1}>{nodes}</VStack>;
  };

  const history = chats.map(m => {
    const isOutgoing = m.from === currentUser;
    const ts = new Date(m.timestamp * 1000);

    return (
      <Box
        key={m.id}
        display="flex"
        justifyContent={isOutgoing ? 'flex-end' : 'flex-start'}
        my={2}
      >
        <Box
          maxW="75%"
          px={4}
          py={2}
          bg={isOutgoing ? outgoingBg : incomingBg}
          color={isOutgoing ? outgoingColor : incomingColor}
          borderRadius="xl"
          boxShadow={isOutgoing ? 'md' : 'sm'}
        >
          {renderContent(m.message)}
          <Text as="span" display="block" mt={1} fontSize="xs" opacity={0.8} textAlign={isOutgoing ? 'right' : 'left'}>
            {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Box>
      </Box>
    );
  });

  return <Container>{history}</Container>;
};

export default ChatHistory;
