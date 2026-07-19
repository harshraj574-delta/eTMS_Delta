/**
 * The backend sometimes returns JSON double-encoded as a string.
 * Normalize once at the service boundary so consumers always receive
 * parsed data. Plain strings (e.g. "1", status text) pass through
 * untouched, so parseInt()-style consumers keep working.
 *
 * Every domain service should wrap its `response.data` with this.
 */
const parseMaybeJson = (data) => {
    let result = data;
    // Responses are sometimes double-encoded; unwrap at most twice.
    for (let i = 0; i < 2 && typeof result === "string"; i++) {
        const s = result.trim();
        if (!s.startsWith("{") && !s.startsWith("[")) break;
        try {
            result = JSON.parse(s);
        } catch {
            break;
        }
    }
    return result;
};

export default parseMaybeJson;
