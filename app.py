from flask import Flask, jsonify
import yfinance as yf
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 从 CSV 文件中读取美股代码及其对应的编号和权重
def load_stock_data():
    try:
        df = pd.read_csv("stock_tickers.csv")
        return df[["Ticker", "Number", "Weight"]].to_dict("records")  # 假设 CSV 文件包含 'Ticker', 'Number', 'Weight' 列
    except FileNotFoundError:
        print("Error: stock_tickers.csv not found.")
        return []

STOCK_DATA = load_stock_data()

def fetch_stock_data(symbol):
    # 使用 yfinance 获取股票数据
    stock = yf.Ticker(symbol)
    stock_info = stock.info  # 获取所有信息字段

    # 检查是否有数据返回
    if stock_info:
        return stock_info
    else:
        return None

@app.route("/api/stocks", methods=["GET"])
def get_stock_data():
    stock_data = []
    for item in STOCK_DATA:
        symbol = item["Ticker"]
        data = fetch_stock_data(symbol)
        if data:
            # 将 Number 和 Weight 添加到返回数据中
            data["Number"] = item["Number"]
            data["Weight"] = item["Weight"]
            stock_data.append(data)
    return jsonify(stock_data)

if __name__ == "__main__":
    app.run(debug=True)
