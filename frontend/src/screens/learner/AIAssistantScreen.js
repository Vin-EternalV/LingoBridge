import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import ChatBubble from "../../components/ChatBubble";
import Header from "../../components/Header";
import { sendChatMessage } from "../../api/ai";
import { COLORS, FONTS, RADIUS, SPACING } from "../../constants/theme";

const SUGGESTIONS = [
  "Explain this grammar rule",
  "Give me an example sentence",
  "Why is my grammar incorrect?",
  "Help me practice business vocabulary",
];

const AIAssistantScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Hello! I'm your LingoBridge AI Tutor. How can I help you with your English today?",
      isUser: false,
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const flatListRef = useRef(null);

  const sendMessage = async (text) => {
    const trimmedText = text.trim();

    if (!trimmedText || isLoading) {
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      text: trimmedText,
      isUser: true,
    };

    // Add the user's message immediately.
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      /*
       * Build conversation history.
       *
       * We don't send the welcome message because it isn't
       * part of the actual conversation.
       */
      const history = messages.slice(1).map((message) => ({
        role: message.isUser ? "user" : "assistant",
        content: message.text,
      }));

      /*
       * Send the message to our backend.
       *
       * The frontend NEVER talks directly to Gemini.
       *
       * Frontend
       *    ↓
       * Express backend
       *    ↓
       * Gemini API
       */
      const response = await sendChatMessage(trimmedText, history);

      if (!response || !response.response) {
        throw new Error("The AI returned an empty response.");
      }

      const aiMessage = {
        id: `${Date.now()}-ai`,
        text: response.response,
        isUser: false,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Assistant error:", error);

      /*
       * Show a useful message instead of hiding
       * everything behind "trouble connecting".
       */
      let errorMessage =
        "Sorry, I could not connect to the AI tutor. Please try again.";

      if (error?.message?.includes("401") || error?.message?.includes("403")) {
        errorMessage =
          "The AI service rejected the request. Please check the Gemini API configuration.";
      } else if (error?.message?.includes("429")) {
        errorMessage =
          "The AI service is temporarily busy or the free-tier limit was reached. Please try again later.";
      } else if (error?.message) {
        errorMessage = `Sorry, something went wrong: ${error.message}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          text: errorMessage,
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSuggestion = (suggestion) => (
    <TouchableOpacity
      key={suggestion}
      style={styles.suggestionBadge}
      onPress={() => sendMessage(suggestion)}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <Text style={styles.suggestionText}>{suggestion}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="LingoBridge AI Tutor" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble message={item.text} isUser={item.isUser} />
          )}
          contentContainerStyle={styles.chatList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({
              animated: true,
            })
          }
        />

        {messages.length < 3 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try asking:</Text>

            <View style={styles.suggestionsWrap}>
              {SUGGESTIONS.map(renderSuggestion)}
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor={COLORS.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(inputText)}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
  },

  chatList: {
    padding: SPACING.base,
    paddingBottom: SPACING.xl,
  },

  suggestionsContainer: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
  },

  suggestionsTitle: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

  suggestionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  suggestionBadge: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },

  suggestionText: {
    ...FONTS.small,
    color: COLORS.primaryDark,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    minHeight: 40,
    maxHeight: 120,
    ...FONTS.regular,
    color: COLORS.text,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: SPACING.sm,
  },

  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});

export default AIAssistantScreen;
