let entries = JSON.parse(localStorage.getItem("deliveryEntries")) || [];
let monthlyTarget = Number(localStorage.getItem("monthlyTarget")) || 0;

const dateInput = document.getElementById("date");
dateInput.value = getLocalDateString();

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function setTarget() {
    const target = prompt(
        "Enter your monthly earnings target:",
        monthlyTarget || ""
    );

    if (target === null) return;

    const amount = Number(target);

    if (!Number.isFinite(amount) || amount < 0) {
        alert("Please enter a valid amount.");
        return;
    }

    monthlyTarget = amount;
    localStorage.setItem("monthlyTarget", String(monthlyTarget));
    updateDashboard();
}

document.getElementById("entryForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const date = document.getElementById("date").value;
    const earnings = Number(document.getElementById("earnings").value);
    const spending = Number(document.getElementById("spending").value);
    const spendingDetails = document.getElementById("spendingDetails").value.trim();

    if (!date || !Number.isFinite(earnings) || !Number.isFinite(spending)) {
        alert("Please enter valid details.");
        return;
    }

    if (earnings < 0 || spending < 0) {
        alert("Amount cannot be negative.");
        return;
    }

    entries.push({
        id: Date.now(),
        date,
        earnings,
        spending,
        spendingDetails,
        net: earnings - spending
    });

    saveData();

    document.getElementById("earnings").value = "";
    document.getElementById("spending").value = "";
    document.getElementById("spendingDetails").value = "";

    updateDashboard();
});

function saveData() {
    localStorage.setItem("deliveryEntries", JSON.stringify(entries));
}

function updateDashboard() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}`;

    document.getElementById("currentMonth").textContent =
        now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

    const monthEntries = entries.filter(entry => entry.date.startsWith(monthKey));

    const totalEarnings = monthEntries.reduce((sum, entry) => sum + Number(entry.earnings), 0);
    const totalSpending = monthEntries.reduce((sum, entry) => sum + Number(entry.spending), 0);
    const netIncome = totalEarnings - totalSpending;

    document.getElementById("targetAmount").textContent = formatNumber(monthlyTarget);
    document.getElementById("totalEarnings").textContent = formatNumber(totalEarnings);
    document.getElementById("totalSpending").textContent = formatNumber(totalSpending);
    document.getElementById("netIncome").textContent = formatNumber(netIncome);

    const progress = monthlyTarget > 0 ? (totalEarnings / monthlyTarget) * 100 : 0;
    document.getElementById("progressBar").style.width = `${Math.min(progress, 100)}%`;
    document.getElementById("progressPercent").textContent = `${progress.toFixed(1)}% completed`;

    const remaining = Math.max(monthlyTarget - totalEarnings, 0);
    document.getElementById("remainingAmount").textContent = formatNumber(remaining);

    const today = getLocalDateString();
    const todayEntries = entries.filter(entry => entry.date === today);
    const todayEarnings = todayEntries.reduce((sum, entry) => sum + Number(entry.earnings), 0);
    const todaySpending = todayEntries.reduce((sum, entry) => sum + Number(entry.spending), 0);

    document.getElementById("todayEarnings").textContent = formatNumber(todayEarnings);
    document.getElementById("todaySpending").textContent = formatNumber(todaySpending);
    document.getElementById("todayNet").textContent = formatNumber(todayEarnings - todaySpending);

    displayHistory();
}

function displayHistory() {
    const container = document.getElementById("historyContainer");

    if (entries.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div>📊</div>
                <p>No entries yet</p>
                <small>Add your first daily entry above.</small>
            </div>
        `;
        return;
    }

    const sortedEntries = [...entries].sort((a, b) => {
        if (a.date === b.date) return b.id - a.id;
        return b.date.localeCompare(a.date);
    });

    container.innerHTML = "";

    sortedEntries.forEach(entry => {
        const item = document.createElement("div");
        item.className = "history-item";

        const date = escapeHtml(formatDate(entry.date));
        const details = escapeHtml(entry.spendingDetails || "—");

        item.innerHTML = `
            <div class="history-top">
                <span class="history-date">${date}</span>
                <span class="history-net">Net: ₹${formatNumber(entry.net)}</span>
            </div>

            <div class="history-details">
                <div><span>Earnings</span>₹${formatNumber(entry.earnings)}</div>
                <div><span>Spending</span>₹${formatNumber(entry.spending)}</div>
                <div><span>Details</span>${details}</div>
            </div>

            <div class="history-actions">
                <button class="delete-btn" onclick="deleteEntry(${entry.id})">Delete</button>
            </div>
        `;

        container.appendChild(item);
    });
}

function deleteEntry(id) {
    if (!confirm("Delete this entry?")) return;

    entries = entries.filter(entry => entry.id !== id);
    saveData();
    updateDashboard();
}

function clearAllData() {
    if (entries.length === 0) {
        alert("There are no entries to delete.");
        return;
    }

    if (!confirm("Are you sure you want to delete ALL your entries?")) return;

    entries = [];
    saveData();
    updateDashboard();
}

function formatNumber(number) {
    return Number(number).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

const darkModeBtn = document.getElementById("darkModeBtn");

if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    darkModeBtn.textContent = "☀️";
}

darkModeBtn.addEventListener("click", function() {
    document.body.classList.toggle("dark");

    const dark = document.body.classList.contains("dark");
    localStorage.setItem("darkMode", String(dark));
    darkModeBtn.textContent = dark ? "☀️" : "🌙";
});

updateDashboard();
