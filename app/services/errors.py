class ServiceError(Exception):
    """Error raised by service code; converted to an HTTP response in app.main."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
