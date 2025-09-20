export const formatService = {
  formatPhoneNumber(phone: string) {
    const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits

    if (cleaned.length === 10) {
      const part1 = cleaned.slice(0, 3);
      const part2 = cleaned.slice(3, 6);
      const part3 = cleaned.slice(6, 10);
      return `${part1}-${part2}-${part3}`;
    }

    return phone; // fallback if not 10 digits
  },

  formatPhoneNumberAsInDB(phone: string) {
    const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits
  
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.slice(1, 11); 
    }
  
    return phone;
  },

formatDate(dateString: string, showTime: boolean = false) {
  const date = new Date(dateString);

  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    ...(showTime && { year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false }),
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
},

};