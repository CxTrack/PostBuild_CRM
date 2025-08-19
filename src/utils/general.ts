  export const calculatePercentage = (oldValue: number, newValue: number): number => {
    let percentChange: number;

    if (oldValue === 0) {
      percentChange = newValue > 0 ? 100 : 0; // or Infinity depending on your use case
    } else {
      percentChange = ((newValue - oldValue) / oldValue) * 100;
    }

    return percentChange;
  }