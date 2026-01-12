// frontend/hooks/internal/readSSE.ts

export async function readSSE(response: Response, onEvent: (event: any) => void) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is empty");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            onEvent(JSON.parse(line.slice(6)));
        }
    }
}
