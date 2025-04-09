// This is a simplified implementation of xhr-sync-worker.js for Lambda environment
// It's meant to be a stub that prevents the error when JSDOM tries to load it

(function () {
  const workerCode = function () {
    // Mock implementation for synchronous XHR in worker
    self.onmessage = function (e) {
      const { id } = e.data;
      // Unused parameters: method, url, headers, data, timeout

      // Respond with a mock response
      self.postMessage({
        id,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: '',
      });
    };
  };

  module.exports = `(${workerCode.toString()})()`;
})();
