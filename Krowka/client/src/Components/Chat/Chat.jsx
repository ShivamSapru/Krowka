import React, { Component } from 'react';
import axios from 'axios';

import SocketConnection from '../../socket-connection';

import {
  Container,
  Flex,
  Textarea,
  Box,
  FormControl,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  Button,
  Input,
  HStack,
  Avatar,
  Heading,
  IconButton,
  Spacer,
  Text,
  Tag,
  TagLabel,
  TagCloseButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
} from '@chakra-ui/react';
import { AttachmentIcon, InfoIcon, SearchIcon } from '@chakra-ui/icons';

import ChatHistory from './ChatHistory';
import ContactList from './ContactList';

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      socketConn: '',
      username: '',
      message: '',
      to: '',
      isInvalid: false,
      endpoint: 'http://localhost:8080',
      contact: '',
      contacts: [],
      chats: [],
      msgs: [],
      selectedFile: null,
      selectedFileName: '',
    };
  }

  componentDidMount = async () => {
    const queryParams = new URLSearchParams(window.location.search);
    const user = queryParams.get('u');
    this.setState({ username: user });
    this.getContacts(user);

    const conn = new SocketConnection();
    await this.setState({ socketConn: conn });
    // conn.connect(msg => console.log('message received'));
    // connect to ws connection
    this.state.socketConn.connect(message => {
      const msg = JSON.parse(message.data);

      // update UI only when message is between from and to
      if (this.state.to === msg.from || this.state.username === msg.from) {
        this.setState(
          {
            chats: [...this.state.chats, msg],
          },
          () => {}
        );
      }
    });

    this.state.socketConn.connected(user);

    console.log('exiting');
  };

  // on change of input, set the value to the message state
  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  onSubmit = e => {
    if (e.charCode === 0 && e.code === 'Enter') {
      e.preventDefault();
      this.sendCurrentMessage();
      // on error change isInvalid to true and message
    }
  };

  uploadAttachment = async () => {
    const { selectedFile, endpoint } = this.state;
    if (!selectedFile) return null;
    const fd = new FormData();
    fd.append('file', selectedFile);
    const res = await axios.post(`${endpoint}/chat/attachment`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (res.data && res.data.status && res.data.data && res.data.data.url) {
      return res.data.data.url;
    }
    return null;
  };

  sendCurrentMessage = async () => {
    const { username, to, message, selectedFileName, selectedFile } = this.state;
    if (!to) return;

    // If only an attachment is selected with empty text, still allow sending
    const hasText = message && message.trim() !== '';
    const hasAttachment = !!selectedFile;
    if (!hasText && !hasAttachment) return;

    let attachmentLine = '';
    if (hasAttachment) {
      try {
        const url = await this.uploadAttachment();
        if (url) {
          attachmentLine = `${url}\n`;
        } else {
          attachmentLine = `[attachment: ${selectedFileName}]\n`;
        }
      } catch (e) {
        attachmentLine = `[attachment: ${selectedFileName}]\n`;
      }
    }
    const composed = `${attachmentLine}${hasText ? message : ''}`.trim();
    const msg = {
      type: 'message',
      chat: {
        from: username,
        to: to,
        message: composed,
      },
    };

    this.state.socketConn.sendMsg(msg);
    this.setState({ message: '', selectedFile: null, selectedFileName: '' });
  };

  // Emoji picker support
  onSelectEmoji = (emoji) => {
    this.setState(prev => ({ message: (prev.message || '') + emoji }));
  };

  // Attachment handling
  fileInputRef = null;
  triggerFilePicker = () => {
    if (this.fileInputRef) this.fileInputRef.click();
  };
  onSelectFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    this.setState({ selectedFile: file, selectedFileName: file.name });
  };

  getContacts = async user => {
    const res = await axios.get(
      `${this.state.endpoint}/contact-list?username=${user}`
    );
    console.log(res.data);
    if (res.data['data'] !== undefined) {
      this.setState({ contacts: res.data.data });
    }
  };

  fetchChatHistory = async (u1 = 'user1', u2 = 'user2') => {
    const res = await axios.get(
      `http://localhost:8080/chat-history?u1=${u1}&u2=${u2}`
    );

    console.log(res.data, res.data.data.reverse());
    if (res.data.status && res.data['data'] !== undefined) {
      this.setState({ chats: res.data.data.reverse() });
    } else {
      this.setState({ chats: [] });
    }
  };

  addContact = async e => {
    e.preventDefault();
    try {
      const res = await axios.post(`${this.state.endpoint}/verify-contact`, {
        username: this.state.contact,
      });

      console.log(res.data);
      if (!res.data.status) {
        this.setState({ isInvalid: true });
      } else {
        // reset state on success
        this.setState({ isInvalid: false });

        let contacts = [...this.state.contacts];
        contacts.unshift({
          username: this.state.contact,
          last_activity: Date.now() / 1000,
        });
        this.setState({ contacts });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Rendering moved to JSX components (ChatHistory, ContactList)

  sendMessageTo = to => {
    this.setState({ to });
    this.fetchChatHistory(this.state.username, to);
  };

  render() {
    const headerBg = '#0000';
    return (
      <Container maxW="6xl" py={4}>
        <Flex gap={4}>
          {/* Sidebar */}
          <Box
            flex={{ base: '1', md: '1' }}
            maxW={{ base: '40%', md: '30%' }}
            borderWidth={1}
            borderRadius="xl"
            height="75vh"
            overflowY="auto"
            p={3}
          >
            {/* Add contact */}
            <Box mb={3} position="sticky" top={0} zIndex={1} bg={headerBg} backdropFilter="blur(4px)">
              <FormControl isInvalid={this.state.isInvalid}>
                <InputGroup size="md">
                  <Input
                    variant="filled"
                    type="text"
                    placeholder="Add contact by username"
                    name="contact"
                    value={this.state.contact}
                    onChange={this.onChange}
                  />
                  <InputRightElement width="5rem">
                    <Button
                      colorScheme={'brand'}
                      h="2rem"
                      size="sm"
                      variant="solid"
                      type="submit"
                      onClick={this.addContact}
                    >
                      Add
                    </Button>
                  </InputRightElement>
                </InputGroup>
                {!this.state.isContactInvalid ? (
                  ''
                ) : (
                  <FormErrorMessage>contact does not exist</FormErrorMessage>
                )}
              </FormControl>
            </Box>

            {/* Contacts */}
            <Box>
              <ContactList contacts={this.state.contacts} onSelect={this.sendMessageTo} />
            </Box>
          </Box>

          {/* Main chat area */}
          <Box flex={{ base: '1', md: '2' }} borderWidth={1} borderRadius="xl" height="75vh" display="flex" flexDirection="column">
            {/* Conversation header */}
            <HStack spacing={3} p={3} borderBottomWidth={1} position="sticky" top={0} bg={headerBg} backdropFilter="blur(4px)">
              <Avatar size="sm" name={this.state.to || 'Select a contact'} />
              <Box>
                <Heading size="sm">{this.state.to || 'Select a contact to start chatting'}</Heading>
                {this.state.to && (() => {
                  const sc = this.state.contacts.find(c => c.username === this.state.to);
                  if (!sc) return null;
                  const now = Math.floor(Date.now() / 1000);
                  const last = sc.last_activity || 0;
                  const delta = now - last;
                  const isOnline = delta < 120; // 2 minutes threshold
                  const dt = new Date(last * 1000);
                  const lastStr = `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
                  return (
                    <Text fontSize="xs" color={isOnline ? 'green.400' : 'gray.500'}>
                      {isOnline ? 'online' : `last seen ${lastStr}`}
                    </Text>
                  );
                })()}
              </Box>
              <Spacer />
              {/* Header actions */}
              <IconButton aria-label="Search in conversation" icon={<SearchIcon />} size="sm" variant="ghost" />
              <IconButton aria-label="Conversation info" icon={<InfoIcon />} size="sm" variant="ghost" />
            </HStack>

            {/* Message history */}
            <Box flex="1" p={2} overflowY="auto" display="flex" flexDirection="column-reverse">
              <ChatHistory currentUser={this.state.username} chats={this.state.chats} />
            </Box>

            {/* Composer */}
            <Box p={3} borderTopWidth={1}>
              <FormControl onKeyDown={this.onSubmit} onSubmit={this.onSubmit}>
                <HStack mb={2} spacing={2}>
                  <Popover placement="top-start" isLazy>
                    <PopoverTrigger>
                      <IconButton
                        aria-label="Insert emoji"
                        icon={<Text as="span">😊</Text>}
                        size="sm"
                        variant="ghost"
                        isDisabled={!this.state.to}
                      />
                    </PopoverTrigger>
                    <PopoverContent w="14rem">
                      <PopoverArrow />
                      <PopoverBody>
                        <HStack wrap="wrap" spacing={1} rowGap={1}>
                          {['😀','😁','😂','🤣','😊','😍','😘','😎','🤔','🙌','👍','👏','🔥','💯','✨','🎉','🥳','🙏'].map(e => (
                            <Button key={e} size="xs" variant="ghost" onClick={() => this.onSelectEmoji(e)}>{e}</Button>
                          ))}
                        </HStack>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    ref={(r) => (this.fileInputRef = r)}
                    onChange={this.onSelectFile}
                  />
                  <IconButton
                    aria-label="Attach file"
                    icon={<AttachmentIcon />}
                    size="sm"
                    variant="ghost"
                    isDisabled={!this.state.to}
                    onClick={this.triggerFilePicker}
                  />
                  {this.state.selectedFileName && (
                    <Tag size="sm" colorScheme="gray" borderRadius="full">
                      <TagLabel>{this.state.selectedFileName}</TagLabel>
                      <TagCloseButton onClick={() => this.setState({ selectedFile: null, selectedFileName: '' })} />
                    </Tag>
                  )}
                </HStack>
                <Textarea
                  type="submit"
                  borderWidth={1}
                  borderRadius={'xl'}
                  minH={'5rem'}
                  placeholder={this.state.to ? 'Type a message… Press Enter to send' : 'Select a contact to start chatting'}
                  size="md"
                  resize={'none'}
                  name="message"
                  value={this.state.message}
                  onChange={this.onChange}
                  isDisabled={this.state.to === ''}
                />
                <HStack mt={2}>
                  <Spacer />
                  <Button colorScheme="brand" onClick={this.sendCurrentMessage} isDisabled={!this.state.to || ((!(this.state.message && this.state.message.trim() !== '')) && !this.state.selectedFileName)}>
                    Send
                  </Button>
                </HStack>
              </FormControl>
            </Box>
          </Box>
        </Flex>
      </Container>
    );
  }
}

export default Chat;
