export const formatTimedelta = (td: number) => {
  td = Math.floor(td / 1000); // Convert milliseconds to seconds
  const hours = Math.floor(td / 3600);
  const minutes = Math.floor((td % 3600) / 60);
  const seconds = Math.floor(td % 60);

  return `${hours} hr, ${minutes} m, ${seconds} s`;
};
