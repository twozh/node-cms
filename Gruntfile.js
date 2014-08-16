module.exports = function(grunt) {
	/* project configuration */
	grunt.initConfig({
		watch: {
			less_file:{
				files: ['public/stylesheets/*.less'],
				tasks: ['less'],
			},

			static_file:{
				files: ['public/**/*.js', 'public/**/*.css', 'views/**/*.jade'],
				options: {
					livereload: true,
				},
			}
		},

		less: {
			compileCore: {
				options: {
					strictMath: true,
					sourceMap: true,
					outputSourceFiles: true,
					sourceMapURL: 'custom-bootstrap.css.map',
					sourceMapFilename: 'public/stylesheets/custom-bootstrap.css.map'
				},

				files: {
					'public/stylesheets/custom-bootstrap.css': 'public/stylesheets/custom-bootstrap.less'
				}
			}
		}
	});

	/* load plugin */
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');

	/* Default task(s). */
	grunt.registerTask('default', ['watch']);
};