type ProfileHeaderProps = {
  firstName: string;
  lastName: string;
  image: string;
  role: string;
};

export default function ProfileHeader({
  firstName,
  lastName,
  image,
  role,
}: ProfileHeaderProps) {
  return (
    <div
      className="bg-[#1228430F] w-full h-72 border-b border-gray-300 shadow-sm flex justify-center flex-col items-center"
    >
      <img
        src={image}
        alt={`${role} profile`}
        className="w-32 h-32 rounded-full border border-gray-300 mt-10 object-cover"
      />
      <h1 className="text-xl font-bold text-gray-800 mt-5">
        {firstName} {lastName}
      </h1>
      <h3 className="text-gray-500">{role}</h3>
    </div>
  );
}
