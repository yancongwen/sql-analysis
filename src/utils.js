export const tryRequest = (
    request,
    maxAttempts = 3,
    times = 0
  ) => {
    return new Promise((resolve, reject) => {
      request()
        .then(resolve)
        .catch((error) => {
          if (times < maxAttempts) {
            console.log(
              `Retry times: ${times + 1}, error message: ${error.message}`
            );
            tryRequest(request, maxAttempts, times + 1).then(resolve, reject);
          } else reject(error);
        });
    });
  };

  export const multiRequest = async (requests, maxNum = 5) => {
    const count = requests.length;
    const results = new Array(count).fill(false);
    let i = 0;
  
    const run = async () => {
      if (i >= count) return;
      const currentIndex = i++;
      try {
        console.log(`start ${currentIndex}`)
        results[currentIndex] = await requests[currentIndex]().catch(e => e);
        console.log(`end ${currentIndex}`)
      } catch (e) {
        console.log(e.message)
      }
      return run(); // Recursively start another request as one finishes
    };
  
    const promises = new Array(maxNum).fill(null).map(() => run());
    await Promise.all(promises); // Wait for all promises to resolve
    return results;
  }
  
  export default {
    tryRequest,
    multiRequest,
  };
  