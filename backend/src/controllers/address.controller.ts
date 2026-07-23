import type { Request, Response, NextFunction } from 'express';
import { created, ok } from '../utils/apiResponse';
import * as addressService from '../services/address.service';
import type { CreateAddressInput, UpdateAddressInput } from '../validators/address.validators';

export async function listAddressesController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await addressService.listAddresses(req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function createAddressController(req: Request, res: Response, next: NextFunction) {
  try {
    created(res, await addressService.createAddress(req.user!.id, req.body as CreateAddressInput));
  } catch (err) {
    next(err);
  }
}

export async function updateAddressController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await addressService.updateAddress(
        req.user!.id,
        req.params.id,
        req.body as UpdateAddressInput,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteAddressController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await addressService.deleteAddress(req.user!.id, req.params.id));
  } catch (err) {
    next(err);
  }
}
