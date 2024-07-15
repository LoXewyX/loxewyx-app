const env = (name: string) => {
  try {
    return import.meta.env[name] || '';
  } catch (e) {
    console.error('Error fetching env:', e);
  }

  return '';
};

export default env;
