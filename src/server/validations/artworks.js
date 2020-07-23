import { Joi, Segments } from 'celebrate';

import { imagesValidation } from '~/common/helpers/validate';
import { slugValidation, paginationValidation } from '~/server/validations';

const defaultValidation = {
  artistId: Joi.number().integer().positive(),
  description: Joi.string().max(2000).required(),
  images: imagesValidation.max(10),
  title: Joi.string().max(128).required(),
};

export default {
  create: {
    [Segments.BODY]: {
      ...defaultValidation,
    },
  },
  readAll: {
    [Segments.PARAMS]: {
      ...paginationValidation,
      orderKey: Joi.string().valid('id', 'createdAt', 'updatedAt', 'title'),
      query: Joi.object(),
    },
  },
  read: {
    [Segments.PARAMS]: {
      ...slugValidation,
    },
  },
  update: {
    [Segments.PARAMS]: {
      ...slugValidation,
    },
    [Segments.BODY]: {
      ...defaultValidation,
    },
  },
  destroy: {
    [Segments.PARAMS]: {
      ...slugValidation,
    },
  },
};
