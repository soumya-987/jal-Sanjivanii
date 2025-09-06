import os
import uuid
from pathlib import Path
from typing import Tuple

from flask import Flask, render_template, request, redirect, url_for, send_file, flash, abort

from data_processing import (
    load_dataframe_from_upload,
    clean_dataframe,
    summarize_dataframe,
    write_dataframe_to_csv,
)


BASE_DIR = Path(__file__).resolve().parent
TMP_DIR = BASE_DIR / "tmp"
TMP_DIR.mkdir(parents=True, exist_ok=True)


def create_app() -> Flask:
    app = Flask(__name__)
    # For demo purposes only. In production, use a strong secret key via env var.
    app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key")

    app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50 MB upload limit
    app.config["UPLOAD_FOLDER"] = str(TMP_DIR)

    @app.get("/")
    def index():
        return render_template("upload.html")

    @app.post("/process")
    def process():
        uploaded_file = request.files.get("data_file")
        if uploaded_file is None or uploaded_file.filename == "":
            flash("Please select a CSV or JSON file to upload.", "error")
            return redirect(url_for("index"))

        try:
            input_dataframe = load_dataframe_from_upload(uploaded_file)
        except Exception as exc:  # noqa: BLE001
            flash(f"Could not read file: {exc}", "error")
            return redirect(url_for("index"))

        if input_dataframe is None or input_dataframe.empty:
            flash("The uploaded file contains no rows after parsing.", "error")
            return redirect(url_for("index"))

        cleaned_dataframe = clean_dataframe(input_dataframe)
        summary = summarize_dataframe(cleaned_dataframe)

        file_path, file_id = write_dataframe_to_csv(
            dataframe=cleaned_dataframe,
            output_directory=Path(app.config["UPLOAD_FOLDER"]),
        )

        return render_template(
            "result.html",
            summary=summary,
            download_url=url_for("download_processed", file_id=file_id),
        )

    @app.get("/download/<file_id>")
    def download_processed(file_id: str):
        safe_id = "".join([c for c in file_id if c.isalnum() or c in ("-", "_")])
        if safe_id != file_id:
            abort(400)

        candidate_path = TMP_DIR / f"{file_id}.csv"
        if not candidate_path.exists():
            abort(404)

        return send_file(
            path_or_file=str(candidate_path),
            as_attachment=True,
            download_name="processed.csv",
            mimetype="text/csv",
        )

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    return app


app = create_app()


if __name__ == "__main__":
    # Run the dev server
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)

