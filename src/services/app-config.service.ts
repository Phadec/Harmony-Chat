// AppConfigService.js

class AppConfigService {
  // Declare the base URL
  baseUrl = 'https://192.168.1.30:7267';

  constructor() {}

  // Method to get the base URL
  getBaseUrl() {
    return this.baseUrl;
  }

  // Method to update the base URL if needed
  setBaseUrl(url: string) {
    this.baseUrl = url;
  }
}

export default new AppConfigService();