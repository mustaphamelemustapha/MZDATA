export const metadata = {
  title: 'Delete Account - MZDATA',
  description: 'Instructions on how to request account deletion for MZDATA.',
};

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Account Deletion Request
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <p className="text-gray-700 text-sm">
              If you wish to delete your MZDATA account and all associated data, you can submit a deletion request to our support team. 
            </p>
            <p className="text-gray-700 text-sm font-semibold">
              Please email us at:
            </p>
            <div className="bg-gray-100 p-3 rounded-md text-center">
              <a href="mailto:mzdatamzdata2@gmail.com" className="text-blue-600 font-medium text-lg">
                mzdatamzdata2@gmail.com
              </a>
            </div>
            <p className="text-gray-700 text-sm">
              In your email, please include the phone number or email address associated with your account and state that you are requesting an account deletion. We will process your request within 7-14 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
