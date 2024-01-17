// place files you want to import through the `$lib` alias in this folder.

import { Decimal } from "@prisma/client/runtime/library";

// Add an ability for BigInt to be converted to JSON
BigInt.prototype.toJSON = function () {
	const int = Number.parseInt(this.toString());
	return int ?? this.toString();
};

Decimal.prototype.toJSON = function () {
	return this.toNumber();
};