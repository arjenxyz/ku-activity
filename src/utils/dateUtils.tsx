// utils/dateUtils.ts
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Dayjs eklentilerini yükle
dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);

// Tarih formatları
export const DATE_FORMATS = {
  DAY_MONTH_YEAR: 'DD MMMM YYYY',
  MONTH_YEAR: 'MMMM YYYY',
  DATABASE_DATE: 'YYYY-MM-DD',
  MONTH_SELECTOR: 'YYYY-MM',
};

// Tarih formatlama yardımcıları
export const formatDate = (
  date: string | Date,
  format: string = DATE_FORMATS.DAY_MONTH_YEAR
): string => {
  return dayjs(date).format(format);
};

// Ay işlemleri
export const getMonthRange = (month: string) => {
  const start = dayjs(month).startOf('month');
  const endDayjs = dayjs(month).endOf('month');
  return {
    start: start.format(DATE_FORMATS.DATABASE_DATE),
    end: endDayjs.format(DATE_FORMATS.DATABASE_DATE),
    daysInMonth: endDayjs.date(),
  };
};

// Takvim görünümü için ay günlerini oluşturma
export const generateCalendarDays = (month: string) => {
  const { start, end, daysInMonth } = getMonthRange(month);
  return Array.from({ length: daysInMonth }, (_, i) =>
    dayjs(start).add(i, 'day').format(DATE_FORMATS.DATABASE_DATE)
  );
};

// Tarih validasyon
export const isValidDate = (date: string, format: string) => {
  return dayjs(date, format).isValid();
};

// İnsan dostu tarih aralığı
export const humanizeDateRange = (startDate: string, endDate: string) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  if (start.isSame(end, 'day')) {
    return start.format('DD MMMM YYYY HH:mm');
  }
  
  return `${start.format('DD MMMM HH:mm')} - ${end.format('DD MMMM YYYY HH:mm')}`;
};

// Proje özel yardımcılar
export const projectDateHelpers = {
  getCurrentMonth: () => dayjs().format(DATE_FORMATS.MONTH_SELECTOR),
  getPreviousMonth: (currentMonth: string) => 
    dayjs(currentMonth).subtract(1, 'month').format(DATE_FORMATS.MONTH_SELECTOR),
  getNextMonth: (currentMonth: string) =>
    dayjs(currentMonth).add(1, 'month').format(DATE_FORMATS.MONTH_SELECTOR),
};
