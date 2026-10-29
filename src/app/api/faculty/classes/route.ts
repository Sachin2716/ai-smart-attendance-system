import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const auth = await requireAuth(['FACULTY', 'ADMIN']);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const faculty = await prisma.faculty.findUnique({
      where: { userId: auth.session!.userId },
    });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty profile not found' }, { status: 404 });
    }

    // Fetch assignments with class and course details
    const assignments = await prisma.teachingAssignment.findMany({
      where: { facultyId: faculty.id },
      include: {
        course: true,
        classSection: {
          include: {
            department: true,
            enrollments: {
              include: {
                student: {
                  include: {
                    faceTemplate: { select: { status: true } },
                    attendanceRecords: {
                      select: { status: true, session: { select: { courseId: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Format assigned classes with student metrics
    const classes = assignments.map((assign) => {
      const students = assign.classSection.enrollments.map((e) => {
        const s = e.student;
        // Filter attendance records for this specific course
        const courseRecords = s.attendanceRecords.filter(
          (r) => r.session.courseId === assign.courseId
        );
        const attended = courseRecords.filter((r) =>
          ['PRESENT', 'LATE', 'EXCUSED'].includes(r.status)
        ).length;
        const total = courseRecords.length;
        const percentage = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 100;

        return {
          id: s.id,
          rollNumber: s.rollNumber,
          name: s.name,
          email: s.email,
          phone: s.phone,
          isFaceEnrolled: s.isFaceEnrolled,
          accountStatus: s.accountStatus,
          totalSessions: total,
          attendedSessions: attended,
          attendancePercentage: percentage,
        };
      });

      return {
        assignmentId: assign.id,
        course: assign.course,
        classSection: {
          id: assign.classSection.id,
          fullLabel: assign.classSection.fullLabel,
          semester: assign.classSection.semester,
          sectionName: assign.classSection.sectionName,
          department: assign.classSection.department.name,
        },
        studentCount: students.length,
        students,
      };
    });

    // Also fetch faculty's weekly timetable slots so classes can be launched directly
    const timetableSlots = await prisma.timetableSlot.findMany({
      where: { facultyId: faculty.id },
      include: {
        course: true,
        classSection: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ success: true, classes, timetableSlots, facultyName: faculty.name });
  } catch (error: any) {
    console.error('Fetch faculty classes error:', error);
    return NextResponse.json({ error: 'Failed to fetch assigned classes' }, { status: 500 });
  }
}
