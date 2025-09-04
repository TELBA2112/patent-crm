import { render, fireEvent, screen } from '@testing-library/react';
import Tasks from './Tasks';

describe('Tasks component', () => {
  const token = 'test-token';
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn((url, options) => {
      if (url.includes('/api/users?role=operator')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { _id: '1', username: 'oper1' },
            { _id: '2', username: 'oper2' },
          ]),
        });
      }
      if (url.includes('/api/jobs')) {
        if (options && options.method === 'POST') {
          const body = JSON.parse(options.body);
          if (!body.phone) {
            return Promise.resolve({
              ok: false,
              json: () => Promise.resolve({ message: 'Telefon raqami majburiy' }),
            });
          }
          if (body.assignedTo && typeof body.assignedTo !== 'string') {
            return Promise.resolve({
              ok: false,
              json: () => Promise.resolve({ message: 'assignedTo noto‘g‘ri' }),
            });
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ _id: 'job1', ...body }) });
        }
        // GET jobs
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders and submits a new job with correct fields', async () => {
    render(<Tasks token={token} />);
    // Wait for operators to load
    expect(await screen.findByText('oper1')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Ism'), { target: { value: 'Ali' } });
    fireEvent.change(screen.getByPlaceholderText('Familiya'), { target: { value: 'Valiyev' } });
    fireEvent.change(screen.getByPlaceholderText('Telefon (majburiy)'), { target: { value: '+998901234567' } });
    fireEvent.change(screen.getByPlaceholderText('Brend'), { target: { value: 'BrandX' } });
    fireEvent.change(screen.getByPlaceholderText('Izoh'), { target: { value: 'Test izoh' } });
    fireEvent.change(screen.getByDisplayValue('Yangi'), { target: { value: 'yangi' } });
    fireEvent.change(screen.getByDisplayValue('Operatorni tanlang'), { target: { value: '1' } });
    fireEvent.click(screen.getByText('Qo‘shish'));
    // No error expected
    expect(await screen.queryByText('Server bilan bog‘lanishda xatolik')).not.toBeInTheDocument();
  });

  it('shows error if phone is missing', async () => {
    render(<Tasks token={token} />);
    fireEvent.change(screen.getByPlaceholderText('Ism'), { target: { value: 'Ali' } });
    fireEvent.click(screen.getByText('Qo‘shish'));
    expect(await screen.findByText('Telefon raqami majburiy')).toBeInTheDocument();
  });
});
