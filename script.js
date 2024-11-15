console.log("Script file loaded");
document.addEventListener("DOMContentLoaded", () => {
    fetchStockData();
    setInterval(fetchStockData, 60000); // 每60秒刷新一次数据

    // 为表头添加点击事件
    document.querySelectorAll("th[data-column]").forEach(th => {
        th.addEventListener("click", () => {
            const column = th.getAttribute("data-column");
            toggleSort(column); // 切换排序
            updateSortIcons(); // 更新排序图标
        });
    });
});

let sortOrder = 'none';
let sortColumn = '';
let originalData = [];

// Function to calculate gradient color based on percentage
function getGradientColor(percent) {
    const minColor = [255, 0, 0];   // Red for negative change
    const zeroColor = [255, 255, 255]; // White for zero change
    const maxColor = [0, 128, 0];   // Green for positive change

    let color;
    if (percent > 0) {
        // Positive change, blend from white to green
        const ratio = Math.min(percent / 5, 1); // Cap at 5% for maximum green
        color = zeroColor.map((c, i) => Math.round(c + (maxColor[i] - c) * ratio));
    } else {
        // Negative change, blend from white to red
        const ratio = Math.min(Math.abs(percent) / 5, 1); // Cap at -5% for maximum red
        color = zeroColor.map((c, i) => Math.round(c + (minColor[i] - c) * ratio));
    }
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

async function fetchStockData() {
    const stockDataElement = document.getElementById("stock-data");
    
    try {
        const response = await fetch("http://127.0.0.1:5000/api/stocks"); // 确保此处的URL是你的API地址
        let data = await response.json();

        // 保存初始顺序的数据
        if (originalData.length === 0) {
            originalData = [...data];
        }

        // 如果有排序列，则对数据进行排序
        if (sortColumn) {
            data = sortData(data, sortColumn, sortOrder);
        } else {
            data = [...originalData];
        }

        // 清空表格内容，仅保留表头
        stockDataElement.innerHTML = ""; 



        data.forEach(stock => {
            const row = document.createElement("tr");
        
            // 调试输出 currentPrice, volume 和 sharesOutstanding
            // console.log("Current Price:", stock.currentPrice);
        
            // 计算日涨幅百分比
            const dailyChangePercent = stock.previousClose 
                ? ((stock.currentPrice / stock.previousClose - 1) * 100).toFixed(2)
                : "N/A";
                
            // 创建表格行内容
            row.innerHTML = `
                <td>${stock.Number || "N/A"}</td>
                <td>${stock.symbol || "N/A"}</td>
                <td>${stock.longName || "N/A"}</td>
                <td>$${stock.currentPrice?.toFixed(2) || "N/A"}</td>
                <td class="daily-change">${dailyChangePercent}%</td>
                <td>$${stock.previousClose?.toFixed(2) || "N/A"}</td>
                <td>${stock.marketCap ? formatNumber(stock.marketCap) : "N/A"}</td>
                <td>${stock.volume? formatNumber(stock.volume) : "N/A"}</td>
                <td>${stock.sharesOutstanding? formatNumber(stock.sharesOutstanding) : "N/A"}</td>
                <td>$${stock.dayHigh?.toFixed(2) || "N/A"}</td>
                <td>$${stock.dayLow?.toFixed(2) || "N/A"}</td>
                <td>${stock.trailingPE?.toFixed(2) || "N/A"}</td>
                <td>${((stock.dividendYield || 0) * 100).toFixed(2)}%</td>
                <td>${stock.sector || "N/A"}</td>
                <td>${stock.Weight || "N/A"}</td>

            `;
            //<td>${stock.volume? formatNumber(stock.volume) : "N/A"}</td>

            stockDataElement.appendChild(row);
        
            // Apply gradient color based on dailyChangePercent value
            const dailyChangeCell = row.querySelector(".daily-change");
            if (dailyChangePercent !== "N/A") {
                dailyChangeCell.style.backgroundColor = getGradientColor(parseFloat(dailyChangePercent));
                dailyChangeCell.style.color = "black"; // Adjust text color if needed
            }
        });
        
    } catch (error) {
        console.error("Error fetching stock data:", error);
    }
}

// 格式化大数字（例如市值）为更易读的格式
function formatNumber(number) {
    if (number >= 1e12) {
        return (number / 1e12).toFixed(4) + "T"; // 万亿
    } else if (number >= 1e9) {
        return (number / 1e9).toFixed(2) + "B"; // 十亿
    } else if (number >= 1e6) {
        return (number / 1e6).toFixed(2) + "M"; // 百万
    } else {
        return number.toLocaleString();
    }
}

// 排序函数，处理包括dailyChangePercent在内的数值排序
function sortData(data, column, order) {
    return data.sort((a, b) => {
        let valueA = a[column] || 0;
        let valueB = b[column] || 0;

        // 处理 dailyChangePercent 列，去掉百分比符号并转换为数值
        if (column === 'dailyChangePercent') {
            valueA = parseFloat((a.currentPrice / a.previousClose - 1) * 100);
            valueB = parseFloat((b.currentPrice / b.previousClose - 1) * 100);
        }

        if (order === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else if (order === 'desc') {
            return valueA < valueB ? 1 : -1;
        }
        return 0;
    });
}

// 切换排序
function toggleSort(column) {
    if (sortColumn === column) {
        if (sortOrder === 'desc') {
            sortOrder = 'asc';
        } else if (sortOrder === 'asc') {
            sortOrder = 'none';
        } else {
            sortOrder = 'desc';
        }
    } else {
        sortColumn = column;
        sortOrder = 'desc';
    }
    fetchStockData();
}

// 更新表头中的排序图标
function updateSortIcons() {
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
        if (sortOrder === 'asc') {
            arrow.textContent = " \u2191"; // 向上箭头
        } else if (sortOrder === 'desc') {
            arrow.textContent = " \u2193"; // 向下箭头
        }
    }
}
