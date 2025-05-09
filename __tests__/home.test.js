import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { LoginPage } from '@/app/components/login/loginPage';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

describe("Authentication tests", () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        useRouter.mockImplementation(() => ({
            push: mockPush,
        }));
        jest.clearAllMocks();
    });

    it('Authentication: successful scenario', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ redirectUrl: '/' }),
        });

        render(<LoginPage />);

        fireEvent.change(await screen.findByPlaceholderText('Login'), {
            target: { value: "Michail" }
        });
        fireEvent.change(await screen.findByPlaceholderText('Password'), {
            target: { value: '123456' }
        });

        fireEvent.click(screen.getByText('LOGIN'));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/users/loginAPI', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'Michail', password: '123456' }),
            });
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });
});