console.log("Script file loaded");

document.addEventListener("DOMContentLoaded", () => {
    let sortColumn = ""; // 当前排序的列
    let sortOrder = "none"; // 当前排序顺序，desc/asc/none

    // 初始化表格数据
    fetchAndDisplayStockData();

    // 每60秒刷新一次数据
    setInterval(() => {
        fetchAndDisplayStockData(sortColumn, sortOrder);
    }, 60000);

    // 为表头添加点击事件
    document.querySelectorAll("th[data-column]").forEach(th => {
        th.addEventListener("click", () => {
            const column = th.getAttribute("data-column");

            // 切换排序状态 (desc → asc → none)
            if (sortColumn === column) {
                if (sortOrder === "desc") {
                    sortOrder = "asc";
                } else if (sortOrder === "asc") {
                    sortOrder = "none";
                } else {
                    sortOrder = "desc";
                }
            } else {
                sortColumn = column;
                sortOrder = "desc"; // 默认从降序开始
            }

            // 更新排序图标
            updateSortIcons(sortColumn, sortOrder);

            // 根据新排序参数获取数据
            fetchAndDisplayStockData(sortColumn, sortOrder);
        });
    });
});

// 从后端获取并显示股票数据
async function fetchAndDisplayStockData(sortColumn = "", sortOrder = "none") {
    try {
        // 构造请求 URL，带上排序参数
        let url = `http://127.0.0.1:5000/api/stocks?sortColumn=${sortColumn}&sortOrder=${sortOrder}`;

        // 从后端获取数据
        const response = await fetch(url);
        const data = await response.json();

        // 获取表格的 tbody 元素
        const stockDataElement = document.getElementById("stock-data");

        // 清空表格内容
        stockDataElement.innerHTML = "";

        // 遍历每条股票数据并创建表格行
        data.forEach(stock => {
            const row = document.createElement("tr");
            //<td>${stock.symbol || "N/A"}</td>
            // 使用后端传递的颜色值和格式化数据
            row.innerHTML = `
                <td>${stock.Number || "N/A"}</td>  
                <td>
                    <a href="http://127.0.0.1:5000/stocks/${stock.symbol}" target="_blank" style="text-decoration: underline;">
                        ${stock.symbol}
                    </a>
                </td>
                <td>${stock.longName || "N/A"}</td>
                <td>$${stock.currentPrice?.toFixed(2) || "N/A"}</td>
                <td style="background-color: ${stock.dailyChangeColor};">${stock.dailyChangePercent}%</td>
                <td>$${stock.previousClose?.toFixed(2) || "N/A"}</td>
                <td>${stock.marketCap || "N/A"}</td>
                <td>${stock.volume || "N/A"}</td>
                <td>${stock.sharesOutstanding || "N/A"}</td>
                <td>$${stock.dayHigh?.toFixed(2) || "N/A"}</td>
                <td>$${stock.dayLow?.toFixed(2) || "N/A"}</td>
                <td>${stock.trailingPE?.toFixed(2) || "N/A"}</td>
                <td>${((stock.dividendYield || 0) * 100).toFixed(2)}%</td>
                <td>${stock.sector || "N/A"}</td>
                <td>${stock.Weight || "N/A"}</td>
            `;
            stockDataElement.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching stock data:", error);
    }
}

// 更新表头中的排序图标
function updateSortIcons(sortColumn, sortOrder) {
    document.querySelectorAll("th[data-column]").forEach(th => {
        const column = th.getAttribute("data-column");
        const arrow = th.querySelector(".sort-arrow");
        if (!arrow) {
            const arrowElement = document.createElement("span");
            arrowElement.classList.add("sort-arrow");
            th.appendChild(arrowElement);
        }
        th.querySelector(".sort-arrow").textContent = "";
    });

    if (sortColumn) {
        const sortedTh = document.querySelector(`th[data-column="${sortColumn}"]`);
        const arrow = sortedTh.querySelector(".sort-arrow");
        if (sortOrder === "asc") {
            arrow.textContent = " \u2191"; // 向上箭头
        } else if (sortOrder === "desc") {
            arrow.textContent = " \u2193"; // 向下箭头
        } else {
            arrow.textContent = ""; // 无箭头
        }
    }
}
