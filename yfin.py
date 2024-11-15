# %%
import yfinance as yf
import pandas as pd

def fetch_stock_data(symbol):
    # 使用 yfinance 获取股票数据
    stock = yf.Ticker(symbol)
    stock_info = stock.info  # 获取所有信息字段

    # 检查是否有数据返回
    if stock_info:
        return stock_info
    else:
        return None

stock_ticker_list = ['TSLA']


a = fetch_stock_data('TSLA')

stock = yf.Ticker('TSLA')
# %%
