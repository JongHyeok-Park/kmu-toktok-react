const handleTextareaChange = (textareaRef) => {
  if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
  }
};

export { handleTextareaChange }