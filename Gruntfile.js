module.exports = function(grunt) {
	/* project configuration */
	grunt.initConfig({
		watch: {
			options: {
				livereload: true,
			},
			static_file:{
				files: ['**/*'],
			},
		},
	});

	/* load plugin */
	grunt.loadNpmTasks('grunt-contrib-watch');

	/* Default task(s). */
	grunt.registerTask('default', ['watch']);
};