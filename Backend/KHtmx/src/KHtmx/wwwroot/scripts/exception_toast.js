// TODO: Add toast for network errors (Server down, shoddy internet, etc.)
htmx.on("htmx:afterRequest", (e) => {
    if (e.detail.xhr.status >= 400) {
        createErrorToast(e);
    }
});

const detailsOpenFlag = "data-details-was-open";

const toastContainerTemplate = `
        <div data-role="toast-container" class="fixed bottom-0 right-0 p-4 flex flex-col gap-4"></div>
    `;

const detailsTemplate = `
        <details data-role="toast" class="bg-red-700 text-white font-bold rounded-2xl px-4 py-2 cursor-pointer max-w-screen-lg">
            <summary class="flex flex-row gap-20 p-4 place-content-between place-items-center">
                <span>
                    <span data-role="Status Code">{Status}</span>
                    <span data-role="Status Text">{StatusText}</span>
                </span>
                <div class="flex flex-row gap-8 place-content-center">
                    <button data-role="Copy Error" class="font-bold py-2 px-4 rounded bg-action hover:bg-action-active focus:bg-action-active">Copy</button>
                    <button data-role="Make Fullscreen" class="font-bold py-2 px-4 rounded bg-action hover:bg-action-active focus:bg-action-active">Fullscreen</button>
                    <button data-role="Dismiss Error" class="font-bold py-2 px-4 rounded bg-action hover:bg-action-active focus:bg-action-active">Dismiss</button>
                </div>
            </summary>
            <pre data-role="Response Text" class="border border-t-0 border-red-400 rounded-b bg-red-800 p-4 text-red-200 cursor-auto overflow-y-auto max-h-96">{ResponseText}</pre>
        </details>
    `;

const dialogTemplate = `
        <dialog data-role="toast" class="p-4 rounded-xl bg-red-700 max-w-[80vw] max-h-[80vh]">
            <header class="flex flex-row gap-20 p-4 place-content-between place-items-center">
                <span>
                    <span data-role="Status Code">{Status}</span>
                    <span data-role="Status Text">{StatusText}</span>
                </span>
                <div class="flex flex-row gap-8 place-content-center">
                    <button data-role="Copy Error" class="font-bold py-2 px-4 rounded bg-action hover:bg-action-active focus:bg-action-active">Copy</button>
                    <button data-role="Make Fullscreen" class="font-bold py-2 px-4 rounded bg-action hover:bg-action-active focus:bg-action-active">Fullscreen</button>
                    <button data-role="Dismiss Error" class="font-bold py-2 px-4 rounded bg-action hover:bg-action-active focus:bg-action-active">Dismiss</button>
                </div>
            </header>
            <main>
                <pre data-role="Response Text" class="border border-t-0 border-gray-400 rounded-b bg-red-800 p-4 text-gray-200 cursor-auto overflow-scroll">{ResponseText}</pre>
            </main>
        </dialog>
    `;

function createErrorToast(e) {
    const toastContainer = ensureToastContainerExists();

    const templateElement = document.createElement("template");
    templateElement.innerHTML = detailsTemplate
        .replace("{Status}", e.detail.xhr.status)
        .replace("{StatusText}", e.detail.xhr.statusText)
        .replace("{ResponseText}", e.detail.xhr.responseText);

    const detailsElement = templateElement.content.querySelector("details");
    toastContainer.appendChild(detailsElement);

    addClickListeners(
        toastContainer,
        detailsElement.querySelector("[data-role='Copy Error']"),
        detailsElement.querySelector("[data-role='Dismiss Error']"),
        detailsElement.querySelector("[data-role='Make Fullscreen']"),
        detailsElement
    );
}

function addClickListeners(toastContainer, copyBtn, closeBtn, fullscreenBtn, toastElement) {
    copyBtn.addEventListener("click", (e) => {
        const text = e.target.closest("[data-role='toast']").querySelector("pre").innerHTML;
        navigator.clipboard.writeText(text);
    });

    closeBtn.addEventListener("click", (e) => {
        e.target.closest("[data-role='toast']").remove();
    });

    fullscreenBtn.addEventListener("click", (e) => {
        const wrapperElement = e.target.closest("[data-role='toast']");
        if (wrapperElement.tagName === "DETAILS") {
            convertToDialog(toastContainer, wrapperElement);
        } else {
            convertToDetails(toastContainer, wrapperElement);
        }
    });

    toastElement.addEventListener("click", () => {
        if (toastElement.tagName !== "DETAILS") return;

        // un-open all other details elements when this one is opened
        toastContainer.querySelectorAll("details").forEach((details) => {
            if (details !== toastElement) {
                details.removeAttribute("open");
            }
        });
    });
}

function convertToDialog(toastContainer, existingDetailsElement) {
    // Get values from existing details element
    const values = {
        Status: existingDetailsElement.querySelector("[data-role='Status Code']").innerHTML,
        StatusText: existingDetailsElement.querySelector("[data-role='Status Text']").innerHTML,
        ResponseText: existingDetailsElement.querySelector("[data-role='Response Text']").innerHTML
    };

    const wasOpen = existingDetailsElement.hasAttribute("open");

    // Create new elements
    const templateElement = document.createElement("template");
    templateElement.innerHTML = dialogTemplate
        .replace("{Status}", values.Status)
        .replace("{StatusText}", values.StatusText)
        .replace("{ResponseText}", values.ResponseText);
    const newDialogElement = templateElement.content.querySelector("dialog");
    existingDetailsElement.replaceWith(newDialogElement);
    if (wasOpen) {
        newDialogElement.setAttribute(detailsOpenFlag, "");
    }

    // Add event listeners to new elements
    const newCopyButtonElement = newDialogElement.querySelector("[data-role='Copy Error']");
    const newCloseButtonElement = newDialogElement.querySelector("[data-role='Dismiss Error']");
    const newFullscreenButtonElement = newDialogElement.querySelector("[data-role='Make Fullscreen']");

    addClickListeners(
        toastContainer,
        newCopyButtonElement,
        newCloseButtonElement,
        newFullscreenButtonElement,
        newDialogElement
    );

    // Open the dialog
    newDialogElement.showModal();
}

function convertToDetails(toastContainer, existingDialogElement) {
    // Get values from existing dialog element
    const values = {
        Status: existingDialogElement.querySelector("[data-role='Status Code']").innerHTML,
        StatusText: existingDialogElement.querySelector("[data-role='Status Text']").innerHTML,
        ResponseText: existingDialogElement.querySelector("[data-role='Response Text']").innerHTML
    };

    // Create new elements
    const templateElement = document.createElement("template");
    templateElement.innerHTML = detailsTemplate
        .replace("{Status}", values.Status)
        .replace("{StatusText}", values.StatusText)
        .replace("{ResponseText}", values.ResponseText);
    const newDetailsElement = templateElement.content.querySelector("details");
    existingDialogElement.replaceWith(newDetailsElement);

    // Add event listeners to new elements
    const newCopyButtonElement = newDetailsElement.querySelector("[data-role='Copy Error']");
    const newCloseButtonElement = newDetailsElement.querySelector("[data-role='Dismiss Error']");
    const newFullscreenButtonElement = newDetailsElement.querySelector("[data-role='Make Fullscreen']");

    // Open the details
    if (existingDialogElement.hasAttribute(detailsOpenFlag)) {
        newDetailsElement.setAttribute("open", "");
    }

    addClickListeners(
        toastContainer,
        newCopyButtonElement,
        newCloseButtonElement,
        newFullscreenButtonElement,
        newDetailsElement
    );
}

function ensureToastContainerExists() {
    const existingToastContainer = document.querySelector("[data-role='toast-container']");
    if (existingToastContainer) {
        return existingToastContainer;
    }

    const templateElement = document.createElement("template");
    templateElement.innerHTML = toastContainerTemplate;
    const newToastContainer = templateElement.content.querySelector("[data-role='toast-container']");
    document.body.appendChild(newToastContainer);

    // add mutation observer to delete the container if it's empty.
    const observer = new MutationObserver((mutations) => {
        if (mutations[0].target.children.length === 0) {
            mutations[0].target.remove();
        }
    });
    observer.observe(newToastContainer, {
        childList: true
    });

    return newToastContainer;
}
