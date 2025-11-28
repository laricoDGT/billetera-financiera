// Function to open view invoice modal
window.openViewInvoiceModal = function (invoiceData) {
    const template = document.getElementById("view-invoice-template");
    const content = document.getElementById("modal-content");
    const overlay = document.getElementById("modal-overlay");

    content.innerHTML = template.innerHTML;
    overlay.classList.remove("hidden");

    const viewContent = document.getElementById("invoice-view-content");

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(Number(amount));
    };

    // Calculate totals
    const items = invoiceData.items;
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = subtotal * (Number(invoiceData.tax_rate) / 100);
    const total = subtotal + taxAmount;

    // Generate HTML content
    const senderName = currentSettings
        ? `${currentSettings.first_name || ""} ${currentSettings.last_name || ""}`.toUpperCase()
        : "";

    const htmlContent = `
        <div class="border-t-4 border-indigo-600 p-6 bg-white dark:bg-slate-800 rounded-lg">
            <!-- Sender Info -->
            <div class="mb-6">
                <h2 class="text-3xl font-bold text-indigo-600 mb-2">${senderName}</h2>
                ${currentSettings?.address ? `<p class="text-sm text-gray-600 dark:text-gray-400">${currentSettings.address}</p>` : ""}
                ${currentSettings?.phone ? `<p class="text-sm text-gray-600 dark:text-gray-400">C: ${currentSettings.phone}</p>` : ""}
                ${currentSettings?.email ? `<p class="text-sm text-gray-600 dark:text-gray-400">E: ${currentSettings.email}</p>` : ""}
            </div>

            <!-- Invoice Title -->
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-6">Invoice</h1>

            <!-- Invoice Details -->
            <div class="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Submitted on:</p>
                    <p class="font-bold text-gray-900 dark:text-white">${new Date(invoiceData.issue_date).toLocaleDateString("en-US")}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Invoice #</p>
                    <p class="font-bold text-gray-900 dark:text-white">${invoiceData.invoice_number || "-"}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Invoice for:</p>
                    <p class="font-bold text-gray-900 dark:text-white">${invoiceData.client_name}</p>
                    ${currentSettings?.default_invoice_for ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${currentSettings.default_invoice_for}</p>` : ""}
                </div>
                <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Due date</p>
                    <p class="font-bold text-gray-900 dark:text-white">${invoiceData.due_date ? new Date(invoiceData.due_date).toLocaleDateString("en-US") : "-"}</p>
                </div>
            </div>

            <!-- Items Table -->
            <div class="overflow-x-auto mb-6">
                <table class="w-full">
                    <thead class="bg-gray-100 dark:bg-slate-700">
                        <tr>
                            <th class="px-4 py-2 text-left text-sm font-bold text-indigo-600 dark:text-indigo-400">Description</th>
                            <th class="px-4 py-2 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400">Qty</th>
                            <th class="px-4 py-2 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400">Unit price</th>
                            <th class="px-4 py-2 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400">Total price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr class="border-b border-gray-200 dark:border-slate-700">
                                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">${item.description}</td>
                                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">${item.quantity}</td>
                                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">${formatCurrency(item.price)}</td>
                                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">${formatCurrency(item.quantity * item.price)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>

            <!-- Totals -->
            <div class="flex justify-end">
                <div class="w-64 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span class="text-gray-900 dark:text-white">${formatCurrency(subtotal)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Adjustments:</span>
                        <span class="text-gray-900 dark:text-white">${formatCurrency(taxAmount)}</span>
                    </div>
                    <div class="flex justify-between text-lg font-bold border-t pt-2">
                        <span class="text-gray-900 dark:text-white">Total:</span>
                        <span class="text-indigo-600">${formatCurrency(total)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    viewContent.innerHTML = htmlContent;
};

