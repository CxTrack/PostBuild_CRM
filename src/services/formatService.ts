export const formatService = {
  formatPhoneNumber(phone: string) {
    const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits

    // Expecting format like +1XXXXXXXXXX
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const country = cleaned.slice(0, 1);
      const area = cleaned.slice(1, 4);
      const prefix = cleaned.slice(4, 7);
      const line = cleaned.slice(7, 11);
      return `+${country} (${area}) ${prefix}-${line}`;
    }

    return phone;
  },

  formatPhoneNumberAsInDB(phone: string) {
    const cleaned = phone.replace(/\D/g, ''); // Remove all non-digits
  
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.slice(1, 11); 
    }
  
    return phone;
  },

  formatDate(dateString: string) {
    const date = new Date(dateString);

    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
  },
};