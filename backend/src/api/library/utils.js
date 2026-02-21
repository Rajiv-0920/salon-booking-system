import jwt from 'jsonwebtoken';

export const generateToken = (res, { id, role }) => {
  const token = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
};

export const isValidTimeFormat = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

export const isValidDateFormat = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

export const parseDateUTC = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const getDayOfWeek = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day)
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase(); // "monday", "tuesday", etc.
};
