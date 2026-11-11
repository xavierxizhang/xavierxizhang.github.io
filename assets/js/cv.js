const viewer = document.querySelector(".cv-viewer");
const status = viewer.querySelector(".cv-status");

try {
  const { getDocument, GlobalWorkerOptions } = await import(viewer.dataset.renderer);
  GlobalWorkerOptions.workerSrc = viewer.dataset.worker;
  const pdf = await getDocument({ url: viewer.dataset.pdf }).promise;

  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    // Render sharply at the widest desktop size; CSS fits each page to the reader.
    const viewport = page.getViewport({ scale: 3 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    canvas.setAttribute("aria-hidden", "true");
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

    const section = document.createElement("section");
    section.className = "cv-page";
    section.setAttribute("aria-label", `Page ${number} of ${pdf.numPages}`);
    section.append(canvas);

    // Supply the original PDF text to assistive technology alongside the page image.
    const text = document.createElement("div");
    text.className = "cv-page-text";
    const content = await page.getTextContent();
    text.textContent = content.items.map((item) => item.str).join(" ");
    section.append(text);
    viewer.append(section);
    page.cleanup();
  }

  status.remove();
} catch (error) {
  status.replaceChildren("The preview could not load. Please ");
  const link = document.createElement("a");
  link.href = viewer.dataset.pdf;
  link.textContent = "open the PDF";
  status.append(link, " to read the CV.");
  console.error("CV preview:", error);
} finally {
  viewer.setAttribute("aria-busy", "false");
}
