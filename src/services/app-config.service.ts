// AppConfigService.js

class AppConfigService {
  // Declare the base URL
  baseUrl = 'https://172.20.10.4:7267';

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