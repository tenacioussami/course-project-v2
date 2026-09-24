// Generic CRUD factory to avoid repeating boilerplate across
// Literature / Equipment / Paper / Element controllers.
const crudFactory = (Model, { populate = 'createdBy', searchFields = [] } = {}) => {
  const getAll = async (req, res, next) => {
    try {
      const filter = {};
      const { search, year, category, status } = req.query;

      if (search && searchFields.length) {
        filter.$or = searchFields.map((f) => ({ [f]: { $regex: search, $options: 'i' } }));
      }
      if (year) filter.publicationYear = year;
      if (category) filter.category = category;
      if (status) filter.status = status;

      const items = await Model.find(filter).populate(populate, 'name email').sort({ createdAt: -1 });
      res.json(items);
    } catch (err) {
      next(err);
    }
  };

  const getOne = async (req, res, next) => {
    try {
      const item = await Model.findById(req.params.id).populate(populate, 'name email');
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  // Resolves uploaded file(s) into schema field names.
  // Supports both upload.single() -> req.file, and upload.fields() -> req.files (object of arrays).
  const applyFiles = (req, payload) => {
    const guessField = (mimetype) => {
      const isImage = mimetype && mimetype.startsWith('image/');
      return payload.__urlField || (isImage ? 'image' : Model.schema.path('pdfUrl') ? 'pdfUrl' : Model.schema.path('fileUrl') ? 'fileUrl' : 'documentUrl');
    };

    if (req.file) {
      payload[guessField(req.file.mimetype)] = req.file.path;
    }
    if (req.files && !Array.isArray(req.files)) {
      // req.files is an object keyed by field name, e.g. { image: [file], file: [file] }
      Object.entries(req.files).forEach(([fieldName, files]) => {
        const f = files[0];
        if (!f) return;
        const targetField = fieldName === 'image' && Model.schema.path('image') ? 'image' : guessField(f.mimetype);
        payload[targetField] = f.path;
      });
    }
    delete payload.__urlField;
  };

  const create = async (req, res, next) => {
    try {
      const payload = { ...req.body, createdBy: req.user._id };
      applyFiles(req, payload);
      const item = await Model.create(payload);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  };

  const update = async (req, res, next) => {
    try {
      const payload = { ...req.body };
      applyFiles(req, payload);
      const item = await Model.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  const remove = async (req, res, next) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      next(err);
    }
  };

  return { getAll, getOne, create, update, remove };
};

module.exports = crudFactory;
