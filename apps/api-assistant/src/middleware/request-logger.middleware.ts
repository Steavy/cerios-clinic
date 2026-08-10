import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
	private readonly logger = new Logger("HTTP");

	use(req: Request, res: Response, next: NextFunction): void {
		if (process.env.LOG_API_REQUESTS !== "true") {
			next();
			return;
		}
		const start = Date.now();
		res.on("finish", () => {
			const duration = Date.now() - start;
			this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
		});
		next();
	}
}
