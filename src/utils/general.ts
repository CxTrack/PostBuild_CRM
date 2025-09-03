  export const calculatePercentage = (oldValue: number, newValue: number): number => {
    let percentChange: number;

    if (oldValue === 0) {
      percentChange = newValue > 0 ? 100 : 0; // or Infinity depending on your use case
    } else {
      percentChange = ((newValue - oldValue) / oldValue) * 100;
    }

    return percentChange;
  }
  

  export function convertActivitiesToLocalTime<T extends { created_at: string }>(
  activities: T[]
) {
  return activities.map(activity => {
    const createdUTC = new Date(activity.created_at); // UTC from DB
    const localTime = createdUTC.toLocaleString(); // Convert to user's local time
    return { ...activity, created_at_local: localTime };
  });
}