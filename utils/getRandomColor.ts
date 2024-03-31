export const getRandomColor = (): string => {
  let r, g, b;
  do {
    r = Math.floor(Math.random() * 256); // Random between 0-255
    g = Math.floor(Math.random() * 256); // Random between 0-255
    b = Math.floor(Math.random() * 256); // Random between 0-255
  } while ((r > 200 && g > 200 && b > 200) || (r > 200 && g > 200 && b < 100)); // Avoiding whitish and yellowish

  return `rgba(${r},${g},${b},0.8)`;
};
