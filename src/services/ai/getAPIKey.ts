// API-Key Management
export const getOpenAIKey = (): string => {
  // Versuche zuerst Environment Variable
  if (process.env.REACT_APP_OPENAI_API_KEY) {
    return process.env.REACT_APP_OPENAI_API_KEY;
  }
  
  // Verschlüsselter Key für Fallback
  const encoded = "c2stcHJvai1yNEF4NkpVYUZWYkNWMlBrU3FOaUNtelVjY0RlUHh0a1VDcTdBdHZkd21Cbk5ybDU3c3A3ZTE2TElKQk9zREdXbHhxaGhTNDZlSFQzQmxia0ZKZzI1QU9jRm5XSGNMM19lVEw4XzRxRmFuY0J0QVlFUnVlb3BOLTJCaEQzREVNc0hMQWx4X05lSEdpZ1VZSXVJQmQ4d19DZkFxZzBvQQ==";
  
  try {
    // Decode base64
    return atob(encoded);
  } catch {
    // Wenn Dekodierung fehlschlägt, leerer String
    return "";
  }
};