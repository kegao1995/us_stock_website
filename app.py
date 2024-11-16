# %%
from flask import Flask, jsonify, request, render_template
import yfinance as yf
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 从 CSV 文件中读取美股代码及其对应的编号和权重
def load_stock_data():
    try:
        df = pd.read_csv("stock_tickers.csv")
        return df[["Ticker", "Number", "Weight"]].to_dict("records")
    except FileNotFoundError:
        print("Error: stock_tickers.csv not found.")
        return []

STOCK_DATA = load_stock_data()

# 获取单个股票数据
def fetch_stock_data(symbol):
    try:
        stock = yf.Ticker(symbol)
        stock_info = stock.info
        if stock_info:
            return {
                "symbol": stock_info.get("symbol", "N/A"),
                "longName": stock_info.get("longName", "N/A"),
                "currentPrice": stock_info.get("currentPrice"),
                "previousClose": stock_info.get("previousClose"),
                "marketCap": stock_info.get("marketCap"),
                "volume": stock_info.get("regularMarketVolume"),
                "sharesOutstanding": stock_info.get("sharesOutstanding"),
                "dayHigh": stock_info.get("dayHigh"),
                "dayLow": stock_info.get("dayLow"),
                "trailingPE": stock_info.get("trailingPE"),
                "dividendYield": stock_info.get("dividendYield"),
                "sector": stock_info.get("sector", "N/A"),
            }
        return None
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return None

# 格式化数字为更易读的字符串
def format_number(number):
    if number is None:
        return "N/A"
    if number >= 1e12:
        return f"{number / 1e12:.4f}T"
    elif number >= 1e9:
        return f"{number / 1e9:.2f}B"
    elif number >= 1e6:
        return f"{number / 1e6:.2f}M"
    else:
        return f"{number:,}"

# 计算颜色渐变
def get_gradient_color(percent):
    if percent is None or percent == "N/A":
        return "#FFFFFF"  # 默认白色
    percent = float(percent)
    if percent > 0:
        ratio = min(percent / 5, 1)
        r, g, b = [255 - int(255 * ratio), 255, 255 - int(255 * ratio)]  # 白到绿
    else:
        ratio = min(abs(percent) / 5, 1)
        r, g, b = [255, 255 - int(255 * ratio), 255 - int(255 * ratio)]  # 白到红
    return f"rgb({r}, {g}, {b})"

@app.route("/api/stocks", methods=["GET"])
def get_stock_data():
    # 获取排序列和顺序参数
    sort_column = request.args.get("sortColumn", "")
    sort_order = request.args.get("sortOrder", "none")

    # 获取股票数据
    stock_data = []
    for item in STOCK_DATA:
        symbol = item["Ticker"]
        data = fetch_stock_data(symbol)
        if data:
            # 添加编号和权重
            data["Number"] = item["Number"]
            data["Weight"] = item["Weight"]
            # 计算日涨跌幅
            if data["currentPrice"] and data["previousClose"]:
                daily_change_percent = ((data["currentPrice"] / data["previousClose"] - 1) * 100)
                data["dailyChangePercent"] = round(daily_change_percent, 2)
                data["dailyChangeColor"] = get_gradient_color(daily_change_percent)
            else:
                data["dailyChangePercent"] = "N/A"
                data["dailyChangeColor"] = "#FFFFFF"
            stock_data.append(data)

    # 排序逻辑
    if sort_column and sort_order != "none":
        reverse = (sort_order == "desc")
        stock_data.sort(key=lambda x: x.get(sort_column, 0) or 0, reverse=reverse)

    # 最后格式化数字
    for stock in stock_data:
        stock["marketCap"] = format_number(stock.get("marketCap"))
        stock["volume"] = format_number(stock.get("volume"))
        stock["sharesOutstanding"] = format_number(stock.get("sharesOutstanding"))

    return jsonify(stock_data)

@app.route("/stocks/<symbol>")
def stock_detail(symbol):
    return render_template("stock_detail.html", symbol=symbol)


# 数据获取函数：增加清理 NaN 数据逻辑
def fetch_stock_history(symbol, period="6mo"):
    """
    获取指定股票的历史数据并清理无效数据。

    参数:
        symbol (str): 股票代码，例如 'AAPL'
        period (str): 时间范围，例如 '6mo', '1y', '5d'

    返回:
        list: 包含股票历史数据的字典列表，过滤掉 NaN 数据
    """
    try:
        # 使用 yfinance 获取历史数据
        stock = yf.Ticker(symbol)
        hist = stock.history(period=period)

        # 转换为字典格式并过滤掉包含 NaN 的记录
        data = hist.reset_index().to_dict("records")
        cleaned_data = [
            {
                "Date": record["Date"].isoformat() if "Date" in record else None,
                "Open": record["Open"] if pd.notnull(record["Open"]) else None,
                "High": record["High"] if pd.notnull(record["High"]) else None,
                "Low": record["Low"] if pd.notnull(record["Low"]) else None,
                "Close": record["Close"] if pd.notnull(record["Close"]) else None,
                "Volume": record["Volume"] if pd.notnull(record["Volume"]) else None,
            }
            for record in data
            if pd.notnull(record["Open"]) and pd.notnull(record["High"]) and pd.notnull(record["Low"]) and pd.notnull(record["Close"])
        ]
        return cleaned_data
    except Exception as e:
        print(f"Error fetching history for {symbol}: {e}")
        return None

# Flask API 路由：增加 period 参数支持
@app.route("/api/stocks/<symbol>/history", methods=["GET"])
def get_stock_history(symbol):
    """
    提供股票历史数据的 API 路由。

    参数:
        symbol (str): 股票代码
        period (str): 时间范围（可选，默认为 '6mo'）

    返回:
        JSON 响应: 股票历史数据或错误消息
    """
    # 从查询参数获取时间范围（默认为 '6mo'）
    period = request.args.get("period", "6mo")

    # 调用数据获取函数
    data = fetch_stock_history(symbol, period=period)
    if data is not None:
        return jsonify(data)  # 返回 JSON 数据
    else:
        return jsonify({"error": "Failed to fetch stock history."}), 500




if __name__ == "__main__":
    app.run(debug=True)

# %%
