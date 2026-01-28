from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)

@app.route("/parse", methods=["POST"])
def parse_file():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]

    if file.filename.endswith(".csv"):
        df = pd.read_csv(file)
    elif file.filename.endswith(".xlsx"):
        df = pd.read_excel(file)
    else:
        return jsonify({"error": "Unsupported file"}), 400

    return jsonify({
        "columns": list(df.columns),
        "rows": df.head(100).to_dict(orient="records")
    })

@app.route("/paste", methods=["POST"])
def paste_data():
    data = request.json.get("data")
    df = pd.DataFrame(data)

    return jsonify({
        "columns": list(df.columns),
        "rows": df.to_dict(orient="records")
    })

if __name__ == "__main__":
    app.run(debug=True)
