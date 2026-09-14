const asyncHandler = require("express-async-handler");
const { getAllStudents, addNewStudent, getStudentDetail, setStudentStatus, updateStudent } = require("./students-service");

const handleGetAllStudents = asyncHandler(async (req, res) => {
    //write your code
    const students = await getAllStudents(req.query);
    res.json({ students });
});

const handleAddStudent = asyncHandler(async (req, res) => {
    //write your code
    const { id: authorId } = req.user;
    const payload = req.body;
    const message = await addNewStudent({ ...payload, authorId });
    res.json(message);
});

const handleUpdateStudent = asyncHandler(async (req, res) => {
    //write your code
    const { id } = req.params;
    const payload = req.body;
    const message = await updateStudent({ ...payload, userId: id });
    res.json(message);
});

const handleGetStudentDetail = asyncHandler(async (req, res) => {
    //write your code
    const { id } = req.params;
    const message = await getStudentDetail(id);
    res.json(message);
});

const handleStudentStatus = asyncHandler(async (req, res) => {
    //write your code
    const { id } = req.params;
    const { status } = req.body;
    const { id: reviewerId } = req.user;
    const message = await setStudentStatus({ userId: id, reviewerId, status });
    res.json(message);
});

module.exports = {
    handleGetAllStudents,
    handleGetStudentDetail,
    handleAddStudent,
    handleStudentStatus,
    handleUpdateStudent,
};
