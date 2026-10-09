// Makes Mongo documents look like the old Firestore ones: { id, ...fields }
export const toJSON = {
  virtuals: false,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
};
